import { type NextRequest, NextResponse } from "next/server"
import { TelnyxClient } from "@/lib/telnyx"
import { db } from "@/lib/database"

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      telnyxApiKey: !!process.env.TELNYX_API_KEY,
      telnyxPublicKey: !!process.env.TELNYX_PUBLIC_KEY,
      telnyxWebhookSecret: !!process.env.TELNYX_WEBHOOK_SIGNING_SECRET,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }

    // Get current messaging profile
    const profile = await db.getDefaultMessagingProfile("mindscape-user-1")
    
    // Get sample contact for testing
    const contacts = await db.getContacts("mindscape-user-1")
    const sampleContact = contacts[0]

    return NextResponse.json({
      success: true,
      message: "Telnyx integration test endpoint",
      environment: envCheck,
      currentProfile: profile ? {
        id: profile.id,
        phoneNumber: profile.profile_id,
        name: profile.name,
        isActive: profile.is_active
      } : null,
      sampleContact: sampleContact ? {
        id: sampleContact.id,
        name: sampleContact.name,
        phone: sampleContact.phone_number
      } : null,
      instructions: {
        step1: "Update phone number: POST /api/update-phone with your real Telnyx number",
        step2: "Set webhook URL in Telnyx portal to: https://your-ngrok-url.ngrok.io/api/webhooks/telnyx",
        step3: "Test SMS sending: POST /api/test-sms with real phone numbers",
        step4: "Test webhook by sending SMS to your Telnyx number"
      }
    })
    
  } catch (error) {
    console.error("[Test Telnyx] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, phoneNumber } = await request.json()
    
    if (action === "update-phone" && phoneNumber) {
      const result = await db.updateMessagingProfilePhone("mindscape-user-1", phoneNumber)
      
      if (result) {
        return NextResponse.json({
          success: true,
          message: "Phone number updated successfully",
          newPhoneNumber: phoneNumber
        })
      } else {
        return NextResponse.json({
          success: false,
          error: "Failed to update phone number"
        }, { status: 500 })
      }
    }
    
    if (action === "test-sms") {
      // Get current profile and sample contact
      const profile = await db.getDefaultMessagingProfile("mindscape-user-1")
      const contacts = await db.getContacts("mindscape-user-1")
      const sampleContact = contacts[0]
      
      if (!profile || !sampleContact) {
        return NextResponse.json({
          success: false,
          error: "No messaging profile or contacts found"
        }, { status: 400 })
      }
      
      // Test SMS sending
      const telnyx = new TelnyxClient(process.env.TELNYX_API_KEY!)
      
      const message = await telnyx.sendMessage({
        to: sampleContact.phone_number,
        from: profile.profile_id,
        text: "Hello from Mindscape Agent! This is a test message.",
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/webhooks/telnyx`
      })
      
      return NextResponse.json({
        success: true,
        message: "Test SMS sent successfully",
        telnyxMessageId: message.id,
        details: {
          to: sampleContact.phone_number,
          from: profile.profile_id,
          text: "Hello from Mindscape Agent! This is a test message."
        }
      })
    }
    
    return NextResponse.json({
      success: false,
      error: "Invalid action. Use 'update-phone' or 'test-sms'"
    }, { status: 400 })
    
  } catch (error) {
    console.error("[Test Telnyx] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
