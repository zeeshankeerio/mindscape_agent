import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { formatPhoneNumber } from "@/lib/telnyx"
import { getHardcodedUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = getHardcodedUser()
    const contacts = await db.getContacts(user.id)
    return NextResponse.json({ contacts })
  } catch (error) {
    console.error("[Contacts API] Error fetching contacts:", error)
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getHardcodedUser()
    const { phone_number, name, avatar_url } = await request.json()

    if (!phone_number) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    const formattedPhone = formatPhoneNumber(phone_number)

    // Check if contact already exists
    const existingContact = await db.getContactByPhone(formattedPhone, user.id)
    if (existingContact) {
      return NextResponse.json({ error: "Contact already exists" }, { status: 409 })
    }

    const contact = await db.createContact({
      phone_number: formattedPhone,
      name,
      avatar_url,
      user_id: user.id,
    })

    return NextResponse.json({ contact }, { status: 201 })
  } catch (error) {
    console.error("[Contacts API] Error creating contact:", error)
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 })
  }
}
