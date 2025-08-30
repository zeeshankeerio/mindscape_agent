import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { getHardcodedUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = getHardcodedUser()
    const { phoneNumber = "+13076249136" } = await request.json()

    console.log(`[Setup Telnyx Number] Setting up phone number: ${phoneNumber} for user: ${user.id}`)

    // Check if messaging profile already exists
    let existingProfile = await db.getDefaultMessagingProfile(user.id)
    
    if (existingProfile) {
      // Update existing profile with the correct phone number
      const updated = await db.updateMessagingProfilePhone(user.id, phoneNumber)
      if (updated) {
        console.log(`[Setup Telnyx Number] Updated existing profile with phone: ${phoneNumber}`)
      } else {
        console.log(`[Setup Telnyx Number] Failed to update existing profile`)
      }
    } else {
      // Create new messaging profile
      const newProfile = await db.createMessagingProfile({
        profile_id: phoneNumber,
        name: "Default Messaging Profile",
        webhook_url: "https://agent.mindscapeanalytics.com/api/webhooks/telnyx",
        webhook_failover_url: "https://agent.mindscapeanalytics.com/api/webhooks/telnyx",
        is_active: true,
        user_id: user.id,
      })
      
      if (newProfile) {
        console.log(`[Setup Telnyx Number] Created new profile with phone: ${phoneNumber}`)
      } else {
        console.log(`[Setup Telnyx Number] Failed to create new profile`)
      }
    }

    // Get updated profile
    const profile = await db.getDefaultMessagingProfile(user.id)
    
    return NextResponse.json({
      success: true,
      message: "Telnyx number configured successfully",
      profile: profile ? {
        id: profile.id,
        phoneNumber: profile.profile_id,
        name: profile.name,
        isActive: profile.is_active,
        webhookUrl: profile.webhook_url
      } : null
    })

  } catch (error) {
    console.error("[Setup Telnyx Number] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = getHardcodedUser()
    const profile = await db.getDefaultMessagingProfile(user.id)
    
    return NextResponse.json({
      success: true,
      message: "Current Telnyx configuration",
      profile: profile ? {
        id: profile.id,
        phoneNumber: profile.profile_id,
        name: profile.name,
        isActive: profile.is_active,
        webhookUrl: profile.webhook_url
      } : null,
      instructions: {
        step1: "Ensure your Telnyx messaging profile has phone number +13076249136",
        step2: "Set webhook URL to: https://agent.mindscapeanalytics.com/api/webhooks/telnyx",
        step3: "Enable webhook events: Inbound SMS, Delivery Receipts, Message Status Updates"
      }
    })

  } catch (error) {
    console.error("[Setup Telnyx Number] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
