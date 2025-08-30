import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { formatPhoneNumber } from "@/lib/telnyx"

export async function POST(request: NextRequest) {
  try {
    const { phone_number, name } = await request.json()

    if (!phone_number) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    const formattedPhone = formatPhoneNumber(phone_number)
    console.log(`[Test Contact] Original: ${phone_number}, Formatted: ${formattedPhone}`)

    // Create test contact
    const contact = await db.createContact({
      phone_number: formattedPhone,
      name: name || `Test Contact ${formattedPhone}`,
      avatar_url: null
    })

    return NextResponse.json({
      success: true,
      message: "Test contact created successfully",
      contact: {
        id: contact.id,
        phone_number: contact.phone_number,
        name: contact.name,
        user_id: contact.user_id
      }
    })

  } catch (error) {
    console.error("[Test Contact] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const contacts = await db.getContacts("mindscape-user-1")
    
    return NextResponse.json({
      success: true,
      message: "Contacts retrieved successfully",
      contacts: contacts.map(c => ({
        id: c.id,
        phone_number: c.phone_number,
        name: c.name,
        user_id: c.user_id
      }))
    })

  } catch (error) {
    console.error("[Test Contact] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
