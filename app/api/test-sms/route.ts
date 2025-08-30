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

    const { to, from, text } = await request.json()
    
    if (!to || !from || !text) {
      return NextResponse.json(
        { error: "Missing required fields: to, from, text" },
        { status: 400 }
      )
    }

    const telnyx = new TelnyxClient(process.env.TELNYX_API_KEY)
    
    console.log("[Test SMS] Sending message:", { to, from, text })
    
    const message = await telnyx.sendMessage({
      to,
      from,
      text,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/webhooks/telnyx`
    })
    
    console.log("[Test SMS] Message sent successfully:", message)
    
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
    console.error("[Test SMS] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Test SMS endpoint ready",
    instructions: "Send POST request with to, from, and text fields",
    example: {
      to: "+15551234567",
      from: "+1987654321",
      text: "Hello from Mindscape Agent!"
    }
  })
}
