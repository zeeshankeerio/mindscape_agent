import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { contactId, phoneNumber } = await request.json()
    
    if (!contactId || !phoneNumber) {
      return NextResponse.json(
        { error: "Contact ID and phone number are required" },
        { status: 400 }
      )
    }

    console.log("[Update Test Contact] Updating contact", contactId, "to phone:", phoneNumber)
    
    // Update the test contact with a real phone number
    const supabase = await db.createServerClient()
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: "Database not configured"
      }, { status: 500 })
    }

    const { error } = await supabase
      .from('contacts')
      .update({ phone_number: phoneNumber })
      .eq('id', contactId)
      .eq('user_id', 'mindscape-user-1')

    if (error) {
      console.error('Error updating test contact:', error)
      return NextResponse.json({
        success: false,
        error: "Failed to update test contact"
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Test contact updated successfully",
      contactId,
      newPhoneNumber: phoneNumber
    })
    
  } catch (error) {
    console.error("[Update Test Contact] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Test contact update endpoint ready",
    instructions: "Send POST request with contactId and phoneNumber fields",
    example: {
      contactId: 1,
      phoneNumber: "+15551234567"
    },
    note: "Use a real phone number you can receive SMS on for testing"
  })
}
