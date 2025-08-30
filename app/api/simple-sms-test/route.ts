import { type NextRequest, NextResponse } from "next/server"
import { TelnyxClient } from "@/lib/telnyx"

export async function POST(request: NextRequest) {
  try {
    if (!process.env.TELNYX_API_KEY) {
      return NextResponse.json(
        { error: "Telnyx API key not configured" },
        { status: 500 }
      )
    }

    const { to, text } = await request.json()
    
    if (!to || !text) {
      return NextResponse.json(
        { error: "Missing required fields: to, text" },
        { status: 400 }
      )
    }

    // Use your real Telnyx phone number as sender
    const from = "+1-307-624-9136"
    
    const telnyx = new TelnyxClient(process.env.TELNYX_API_KEY)
    
    console.log("[Simple SMS Test] Sending message:", { to, from, text })
    
    const message = await telnyx.sendMessage({
      to,
      from,
      text,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/webhooks/telnyx`
    })
    
    console.log("[Simple SMS Test] Message sent successfully:", message)
    
    return NextResponse.json({
      success: true,
      message: "SMS sent successfully",
      telnyxMessageId: message.id,
      details: {
        to,
        from,
        text,
        messageId: message.id
      }
    })
    
  } catch (error) {
    console.error("[Simple SMS Test] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Simple SMS test endpoint ready",
    instructions: "Send POST request with to and text fields",
    example: {
      to: "+15551234567",
      text: "Hello from Mindscape Agent!"
    },
    note: "Uses your real Telnyx number +1-307-624-9136 as sender"
  })
}
