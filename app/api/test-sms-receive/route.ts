import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { formatPhoneNumber } from "@/lib/telnyx"
import { broadcastEvent } from "@/app/api/events/route"

export async function POST(request: NextRequest) {
  try {
    const { from_number, to_number, message_text, is_otp = false } = await request.json()

    if (!from_number || !to_number || !message_text) {
      return NextResponse.json({ 
        error: "Missing required fields: from_number, to_number, message_text" 
      }, { status: 400 })
    }

    const formattedFrom = formatPhoneNumber(from_number)
    const formattedTo = formatPhoneNumber(to_number)
    const userId = "mindscape-user-1"

    console.log(`[Test SMS Receive] Simulating incoming message:`)
    console.log(`[Test SMS Receive] From: ${formattedFrom}`)
    console.log(`[Test SMS Receive] To: ${formattedTo}`)
    console.log(`[Test SMS Receive] Content: ${message_text}`)
    console.log(`[Test SMS Receive] Is OTP: ${is_otp}`)

    // Find or create contact
    let contact = await db.getContactByPhone(formattedFrom, userId)
    if (!contact) {
      contact = await db.createContact({
        phone_number: formattedFrom,
        name: `Test Contact ${formattedFrom}`,
        avatar_url: null
      })
      console.log(`[Test SMS Receive] Created test contact: ${contact.id}`)
    }

    // Store message in database
    const storedMessage = await db.createMessage({
      telnyx_message_id: `test-${Date.now()}`,
      contact_id: contact.id,
      direction: "inbound",
      message_type: "SMS",
      content: message_text,
      media_urls: [],
      status: "delivered",
      from_number: formattedFrom,
      to_number: formattedTo,
      user_id: userId,
      metadata: {
        is_otp: is_otp,
        received_at: new Date().toISOString(),
        message_length: message_text.length,
        has_media: false,
        is_test: true
      }
    })

    console.log(`[Test SMS Receive] Stored test message: ${storedMessage.id}`)

    // Broadcast message to real-time clients
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

    // If it's an OTP, also broadcast OTP event
    if (is_otp) {
      broadcastEvent({
        type: "otp.received",
        data: {
          message: storedMessage,
          contact,
          otp: message_text.trim(),
          timestamp: Date.now()
        },
        userId: userId,
        timestamp: Date.now(),
      })
    }

    return NextResponse.json({
      success: true,
      message: "Test SMS received and processed successfully",
      stored_message: {
        id: storedMessage.id,
        content: storedMessage.content,
        from_number: storedMessage.from_number,
        is_otp: is_otp,
        contact: {
          id: contact.id,
          name: contact.name,
          phone_number: contact.phone_number
        }
      }
    })

  } catch (error) {
    console.error("[Test SMS Receive] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Test SMS Receive endpoint",
    usage: {
      method: "POST",
      body: {
        from_number: "string (phone number)",
        to_number: "string (your Telnyx number)",
        message_text: "string (message content)",
        is_otp: "boolean (optional, default: false)"
      }
    },
    examples: {
      regular_sms: {
        from_number: "+1234567890",
        to_number: "+13076249136",
        message_text: "Hello from test!"
      },
      otp_message: {
        from_number: "+1234567890",
        to_number: "+13076249136",
        message_text: "123456",
        is_otp: true
      }
    }
  })
}
