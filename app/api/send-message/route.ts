import { type NextRequest, NextResponse } from "next/server"
import { TelnyxClient } from "@/lib/telnyx"
import { db } from "@/lib/database"
import { formatPhoneNumber } from "@/lib/telnyx"
import { getHardcodedUser } from "@/lib/auth"
import { broadcastEvent } from "@/app/api/events/route"

const telnyxClient = new TelnyxClient(process.env.TELNYX_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    // Check if Telnyx API key is configured
    if (!process.env.TELNYX_API_KEY) {
      return NextResponse.json(
        { error: "Telnyx API key not configured. Please set TELNYX_API_KEY environment variable." },
        { status: 500 }
      )
    }

    const user = getHardcodedUser()
    const { to, from, text, media_urls } = await request.json()

    // Validate required fields
    if (!to || !from || (!text && !media_urls?.length)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const formattedTo = formatPhoneNumber(to)
    const formattedFrom = formatPhoneNumber(from)

    // Find or create contact
    let contact = await db.getContactByPhone(formattedTo, user.id)
    if (!contact) {
      contact = await db.createContact({
        phone_number: formattedTo,
        name: undefined,
        avatar_url: undefined,
        user_id: user.id,
      })
    }

    // Send message via Telnyx
    const telnyxMessage = await telnyxClient.sendMessage({
      from: formattedFrom,
      to: formattedTo,
      text,
      media_urls,
    })

    // Store message in database
    const storedMessage = await db.createMessage({
      telnyx_message_id: telnyxMessage.id,
      contact_id: contact.id,
      direction: "outbound",
      message_type: media_urls && media_urls.length > 0 ? "MMS" : "SMS",
      content: text,
      media_urls: media_urls || [],
      status: "sent",
      from_number: formattedFrom,
      to_number: formattedTo,
      user_id: user.id,
    })

    // Broadcast new message to real-time clients
    broadcastEvent({
      type: "new_message",
      message: storedMessage,
      userId: user.id,
    })

    console.log(`[Send Message] Message sent: ${storedMessage.id}`)

    return NextResponse.json({
      success: true,
      message: storedMessage,
      telnyx_id: telnyxMessage.id,
    })
  } catch (error) {
    console.error("[Send Message] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send message" },
      { status: 500 },
    )
  }
}
