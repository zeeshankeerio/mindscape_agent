import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { getHardcodedUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = getHardcodedUser()
    
    // Get current configuration
    const profile = await db.getDefaultMessagingProfile(user.id)
    const contacts = await db.getContacts(user.id)
    const messages = await db.getMessages(user.id, undefined, 10)
    
    return NextResponse.json({
      success: true,
      message: "SMS Reception Test Status",
      configuration: {
        telnyxNumber: profile?.profile_id || "Not configured",
        webhookUrl: profile?.webhook_url || "Not configured",
        isActive: profile?.is_active || false,
        userId: user.id
      },
      currentData: {
        totalContacts: contacts.length,
        totalMessages: messages.length,
        recentMessages: messages.slice(0, 5).map(m => ({
          id: m.id,
          direction: m.direction,
          content: m.content?.substring(0, 50) + "...",
          from: m.from_number,
          to: m.to_number,
          status: m.status,
          created_at: m.created_at
        }))
      },
      testingInstructions: {
        step1: "Send SMS to +13076249136 from your phone",
        step2: "Check if message appears in dashboard",
        step3: "Verify webhook logs in terminal",
        step4: "Check database for stored message",
        step5: "Test OTP detection with 4-6 digit codes"
      },
      webhookStatus: {
        endpoint: "/api/webhooks/telnyx",
        expectedEvents: ["message.received", "message.sent", "message.delivered"],
        testUrl: "https://webhook.site/ (for external testing)"
      }
    })

  } catch (error) {
    console.error("[Test SMS Reception] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, phoneNumber, messageText } = await request.json()
    const user = getHardcodedUser()

    switch (action) {
      case "check_webhook":
        // Check if webhook endpoint is accessible
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/telnyx`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: {
                event_type: "message.received",
                id: "test-webhook-" + Date.now(),
                occurred_at: new Date().toISOString(),
                payload: {
                  id: "test-message-" + Date.now(),
                  record_type: "message",
                  direction: "inbound",
                  message_type: "SMS",
                  from: { phone_number: phoneNumber || "+1234567890" },
                  to: { phone_number: "+13076249136" },
                  text: messageText || "Test message from webhook test",
                  received_at: new Date().toISOString()
                }
              }
            })
          })
          
          return NextResponse.json({
            success: true,
            message: "Webhook test completed",
            status: response.status,
            statusText: response.statusText,
            webhookAccessible: response.ok
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            message: "Webhook test failed",
            error: error instanceof Error ? error.message : "Unknown error"
          })
        }

      case "simulate_incoming_sms":
        // Simulate an incoming SMS by creating a test message
        try {
          const contact = await db.createContact({
            phone_number: phoneNumber || "+1234567890",
            name: "Test Contact",
            avatar_url: undefined // Changed from null to undefined
          })

          const message = await db.createMessage({
            telnyx_message_id: "test-sim-" + Date.now(),
            contact_id: contact.id,
            direction: "inbound",
            message_type: "SMS",
            content: messageText || "Simulated incoming SMS for testing",
            media_urls: [],
            status: "delivered",
            from_number: phoneNumber || "+1234567890",
            to_number: "+13076249136",
            user_id: user.id
          })

          return NextResponse.json({
            success: true,
            message: "Incoming SMS simulated successfully",
            contact: {
              id: contact.id,
              phone_number: contact.phone_number,
              name: contact.name
            },
            message: {
              id: message.id,
              content: message.content,
              direction: message.direction,
              status: message.status
            }
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            message: "Failed to simulate incoming SMS",
            error: error instanceof Error ? error.message : "Unknown error"
          })
        }

      case "check_database":
        // Check database connectivity and recent messages
        try {
          const contacts = await db.getContacts(user.id)
          const messages = await db.getMessages(user.id, undefined, 20)
          
          return NextResponse.json({
            success: true,
            message: "Database check completed",
            database: {
              contactsCount: contacts.length,
              messagesCount: messages.length,
              recentMessages: messages.slice(0, 5).map(m => ({
                id: m.id,
                direction: m.direction,
                content: m.content?.substring(0, 30) + "...",
                from: m.from_number,
                to: m.to_number,
                created_at: m.created_at
              }))
            }
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            message: "Database check failed",
            error: error instanceof Error ? error.message : "Unknown error"
          })
        }

      default:
        return NextResponse.json({
          success: false,
          error: "Invalid action. Use: check_webhook, simulate_incoming_sms, or check_database"
        }, { status: 400 })
    }

  } catch (error) {
    console.error("[Test SMS Reception] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
