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
    const fromNumber = formatPhoneNumber(message.from.phone_number)
    const toNumber = formatPhoneNumber(message.to.phone_number)

    console.log(`[v0] Processing incoming message from ${fromNumber} to ${toNumber}`)

    const { data: settings } = await supabase.from("inbound_settings").select("*").single()

    // Check if number is blocked
    if (settings?.blocked_numbers?.includes(fromNumber)) {
      console.log(`[v0] [Telnyx Webhook] Blocked number attempted to send message: ${fromNumber}`)
      return
    }

    // Check for keyword filters
    const messageText = message.text?.toLowerCase() || ""
    const hasKeywordFilter = settings?.keyword_filters?.some((keyword: string) =>
      messageText.includes(keyword.toLowerCase()),
    )

    if (hasKeywordFilter) {
      console.log(`[v0] [Telnyx Webhook] Message contains filtered keyword: ${fromNumber}`)
      return
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

    // Use hardcoded user ID for all incoming messages
    const userId = "mindscape-user-1"

    let { data: contact } = await supabase.from("contacts").select("*").eq("phone_number", fromNumber).eq("user_id", userId).single()

    if (!contact) {
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
      console.log(`[v0] Created new contact: ${contact?.id}`)
    }

    if (!contact) {
      console.error("[v0] Failed to create or find contact")
      return
    }

    // Extract media URLs for MMS
    const mediaUrls = message.media?.map((media: any) => media.url) || []

    const { data: storedMessage } = await supabase
      .from("messages")
      .insert({
        telnyx_message_id: message.id,
        contact_id: contact.id,
        direction: "inbound",
        message_type: message.media && message.media.length > 0 ? "MMS" : "SMS",
        content: message.text || "",
        media_urls: mediaUrls,
        status: "delivered",
        from_number: fromNumber,
        to_number: toNumber,
        user_id: userId,
      })
      .select()
      .single()

    console.log(`[v0] [Telnyx Webhook] Stored incoming message: ${storedMessage?.id}`)

    if (storedMessage) {
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
    }

    // Send auto-reply if enabled
    if (settings?.auto_reply_enabled && settings.auto_reply_message) {
      await sendAutoReply(toNumber, fromNumber, settings.auto_reply_message)
    }
  } catch (error) {
    console.error("[v0] [Telnyx Webhook] Error handling incoming message:", error)
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
