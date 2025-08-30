import { type NextRequest, NextResponse } from "next/server"
import { TelnyxClient, type TelnyxWebhookPayload } from "@/lib/telnyx"
import { createClient } from "@supabase/supabase-js"
import { formatPhoneNumber } from "@/lib/telnyx"
import { broadcastEvent } from "@/app/api/events/route"

// Initialize Telnyx client
const telnyxClient = new TelnyxClient(process.env.TELNYX_API_KEY || "")

// Initialize Supabase client with fallback
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase environment variables not configured. Webhook processing will be limited.")
    return null
  }
  
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body and headers
    const body = await request.text()
    const signature = request.headers.get("telnyx-signature-ed25519") || ""
    const timestamp = request.headers.get("telnyx-timestamp") || ""

    console.log(`[v0] [Telnyx Webhook] Received webhook with signature: ${signature ? "present" : "missing"}`)

    if (process.env.NODE_ENV === "production") {
      const isValid = telnyxClient.validateWebhookSignature(body, signature, timestamp)
      if (!isValid) {
        console.error("[v0] Invalid webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    // Parse the webhook payload
    const payload: TelnyxWebhookPayload = JSON.parse(body)
    const { event_type } = payload.data
    const message = payload.data.payload

    console.log(`[v0] [Telnyx Webhook] Received event: ${event_type} for message: ${message.id}`)

    // Get Supabase client
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.warn("[v0] [Telnyx Webhook] Supabase not configured, skipping database operations")
      return NextResponse.json({ received: true, warning: "Database not configured" }, { status: 200 })
    }

    // Handle different event types
    switch (event_type) {
      case "message.received":
        await handleIncomingMessage(message, supabase)
        break

      case "message.sent":
        await handleMessageSent(message, supabase)
        break

      case "message.delivered":
        await handleMessageDelivered(message, supabase)
        break

      case "message.delivery_failed":
        await handleMessageFailed(message, supabase)
        break

      default:
        console.log(`[v0] [Telnyx Webhook] Unhandled event type: ${event_type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] [Telnyx Webhook] Error processing webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handleIncomingMessage(message: any, supabase: any) {
  try {
    // Import enhanced phone number validation
    const { normalizePhoneNumber } = await import("@/lib/telnyx")
    
    let fromNumber: string
    let toNumber: string
    
    try {
      fromNumber = normalizePhoneNumber(message.from.phone_number)
      toNumber = normalizePhoneNumber(message.to.phone_number)
    } catch (error) {
      console.error(`[v0] [Telnyx Webhook] Invalid phone number format:`, error)
      return // Skip processing if phone numbers are invalid
    }
    const messageText = message.text || ""
    const messageId = message.id

    console.log(`[v0] [Telnyx Webhook] Processing incoming message: ${messageId}`)
    console.log(`[v0] [Telnyx Webhook] From: ${fromNumber}, To: ${toNumber}`)
    console.log(`[v0] [Telnyx Webhook] Content: ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}`)

    // Use hardcoded user ID for all incoming messages
    const userId = "mindscape-user-1"

    // Get or create inbound settings with fallback
    let settings = null
    try {
      const { data: settingsData } = await supabase.from("inbound_settings").select("*").eq("user_id", userId).single()
      settings = settingsData
    } catch (error) {
      console.log(`[v0] [Telnyx Webhook] No inbound settings found, using defaults`)
      // Create default inbound settings if none exist
      try {
        const { data: newSettings } = await supabase
          .from("inbound_settings")
          .insert({
            user_id: userId,
            blocked_numbers: [],
            keyword_filters: [],
            business_hours_only: false,
            auto_reply_enabled: false,
            auto_reply_message: ""
          })
          .select()
          .single()
        settings = newSettings
      } catch (createError) {
        console.log(`[v0] [Telnyx Webhook] Could not create default settings, continuing with null`)
      }
    }

    // Check if number is blocked
    if (settings?.blocked_numbers?.includes(fromNumber)) {
      console.log(`[v0] [Telnyx Webhook] Blocked number attempted to send message: ${fromNumber}`)
      return
    }

    // Check for keyword filters
    if (settings?.keyword_filters?.length > 0) {
      const hasKeywordFilter = settings.keyword_filters.some((keyword: string) =>
        messageText.toLowerCase().includes(keyword.toLowerCase()),
      )

      if (hasKeywordFilter) {
        console.log(`[v0] [Telnyx Webhook] Message contains filtered keyword: ${fromNumber}`)
        return
      }
    }

    // Check business hours if enabled
    if (settings?.business_hours_only) {
      const now = new Date()
      const currentDay = now.getDay()
      const currentTime = now.toTimeString().slice(0, 8)

      const isBusinessDay = settings.business_days?.includes(currentDay)
      const isBusinessHours = currentTime >= settings.business_hours_start && currentTime <= settings.business_hours_end

      if (!isBusinessDay || !isBusinessHours) {
        console.log(`[v0] [Telnyx Webhook] Message received outside business hours: ${fromNumber}`)
        return
      }
    }

    // Find or create contact
    let contact = null
    try {
      const { data: existingContact } = await supabase
        .from("contacts")
        .select("*")
        .eq("phone_number", fromNumber)
        .eq("user_id", userId)
        .single()

      if (existingContact) {
        contact = existingContact
        console.log(`[v0] [Telnyx Webhook] Found existing contact: ${contact.id}`)
      }
    } catch (error) {
      // Contact doesn't exist, create new one
      console.log(`[v0] [Telnyx Webhook] Creating new contact for: ${fromNumber}`)
    }

    if (!contact) {
      try {
        const { data: newContact } = await supabase
          .from("contacts")
          .insert({
            phone_number: fromNumber,
            name: `Contact ${fromNumber}`,
            user_id: userId
          })
          .select()
          .single()

        contact = newContact
        console.log(`[v0] [Telnyx Webhook] Created new contact: ${contact?.id}`)
      } catch (createError) {
        console.error(`[v0] [Telnyx Webhook] Failed to create contact:`, createError)
        return
      }
    }

    if (!contact) {
      console.error("[v0] [Telnyx Webhook] Failed to create or find contact")
      return
    }

    // Extract media URLs for MMS
    const mediaUrls = message.media?.map((media: any) => media.url) || []

    // Detect if this is an OTP message
    const isOTP = /^\d{4,8}$/.test(messageText.trim()) || 
                  messageText.toLowerCase().includes('otp') ||
                  messageText.toLowerCase().includes('verification') ||
                  messageText.toLowerCase().includes('code')

    // Store message in database
    const { data: storedMessage } = await supabase
      .from("messages")
      .insert({
        telnyx_message_id: messageId,
        contact_id: contact.id,
        direction: "inbound",
        message_type: message.media && message.media.length > 0 ? "MMS" : "SMS",
        content: messageText,
        media_urls: mediaUrls,
        status: "delivered",
        from_number: fromNumber,
        to_number: toNumber,
        user_id: userId,
        // Add metadata for OTP detection
        metadata: {
          is_otp: isOTP,
          received_at: new Date().toISOString(),
          message_length: messageText.length,
          has_media: mediaUrls.length > 0
        }
      })
      .select()
      .single()

    console.log(`[v0] [Telnyx Webhook] Stored incoming message: ${storedMessage?.id}`)
    console.log(`[v0] [Telnyx Webhook] OTP detected: ${isOTP}`)

    if (storedMessage) {
      // Broadcast new message to real-time clients
      broadcastEvent({
        type: "message.received",
        data: {
          message: {
            ...storedMessage,
            contact,
          },
        },
        userId: userId,
        timestamp: Date.now(),
      })

      // Special handling for OTP messages
      if (isOTP) {
        console.log(`[v0] [Telnyx Webhook] OTP message received and processed: ${messageText}`)
        
        // Broadcast OTP-specific event
        broadcastEvent({
          type: "otp.received",
          data: {
            message: storedMessage,
            contact,
            otp: messageText.trim(),
            timestamp: Date.now()
          },
          userId: userId,
          timestamp: Date.now(),
        })
      }
    }

    // Send auto-reply if enabled
    if (settings?.auto_reply_enabled && settings.auto_reply_message) {
      try {
        await sendAutoReply(toNumber, fromNumber, settings.auto_reply_message)
        console.log(`[v0] [Telnyx Webhook] Auto-reply sent to: ${fromNumber}`)
      } catch (autoReplyError) {
        console.error(`[v0] [Telnyx Webhook] Failed to send auto-reply:`, autoReplyError)
      }
    }

    console.log(`[v0] [Telnyx Webhook] Successfully processed incoming message: ${messageId}`)

  } catch (error) {
    console.error("[v0] [Telnyx Webhook] Error handling incoming message:", error)
    // Don't throw error to prevent webhook failure
  }
}

async function handleMessageSent(message: any, supabase: any) {
  try {
    if (message.id) {
      console.log(`[v0] [Telnyx Webhook] Message sent: ${message.id}`)

      const { data: updatedMessage } = await supabase
        .from("messages")
        .update({ status: "sent" })
        .eq("telnyx_message_id", message.id)
        .select("user_id")
        .single()

      // Broadcast status update to connected clients
      if (updatedMessage?.user_id) {
        broadcastEvent({
          type: "message.status",
          data: {
            messageId: message.id,
            status: "sent",
          },
          userId: updatedMessage.user_id,
          timestamp: Date.now(),
        })
      }
    }
  } catch (error) {
    console.error("[v0] [Telnyx Webhook] Error handling message sent:", error)
  }
}

async function handleMessageDelivered(message: any, supabase: any) {
  try {
    if (message.id) {
      console.log(`[v0] [Telnyx Webhook] Message delivered: ${message.id}`)

      const { data: updatedMessage } = await supabase
        .from("messages")
        .update({ status: "delivered" })
        .eq("telnyx_message_id", message.id)
        .select("user_id")
        .single()

      if (updatedMessage?.user_id) {
        broadcastEvent({
          type: "message.status",
          data: {
            messageId: message.id,
            status: "delivered",
          },
          userId: updatedMessage.user_id,
          timestamp: Date.now(),
        })
      }
    }
  } catch (error) {
    console.error("[v0] [Telnyx Webhook] Error handling message delivered:", error)
  }
}

async function handleMessageFailed(message: any, supabase: any) {
  try {
    if (message.id) {
      console.log(`[v0] [Telnyx Webhook] Message failed: ${message.id}`)

      const { data: updatedMessage } = await supabase
        .from("messages")
        .update({ status: "failed" })
        .eq("telnyx_message_id", message.id)
        .select("user_id")
        .single()

      // Broadcast status update to connected clients
      if (updatedMessage?.user_id) {
        broadcastEvent({
          type: "message.status",
          data: {
            messageId: message.id,
            status: "failed",
            error: message.errors?.[0]?.detail || "Delivery failed",
          },
          userId: updatedMessage.user_id,
          timestamp: Date.now(),
        })
      }
    }
  } catch (error) {
    console.error("[v0] [Telnyx Webhook] Error handling message failed:", error)
  }
}

async function sendAutoReply(fromNumber: string, toNumber: string, message: string) {
  try {
    await telnyxClient.sendMessage({
      from: fromNumber,
      to: toNumber,
      text: message,
    })

    console.log(`[v0] [Telnyx Webhook] Auto-reply sent to: ${toNumber}`)
  } catch (error) {
    console.error("[v0] [Telnyx Webhook] Error sending auto-reply:", error)
  }
}
