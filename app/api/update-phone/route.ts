import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      )
    }

    console.log("[Update Phone] Updating phone number to:", phoneNumber)
    
    // Update the messaging profile with the real phone number
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
    
  } catch (error) {
    console.error("[Update Phone] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Phone number update endpoint ready",
    instructions: "Send POST request with phoneNumber field",
    example: {
      phoneNumber: "+15551234567"
    }
  })
}
