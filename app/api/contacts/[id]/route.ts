import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { getHardcodedUser } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getHardcodedUser()
    const contactId = Number.parseInt(params.id)

    if (isNaN(contactId)) {
      return NextResponse.json({ error: "Invalid contact ID" }, { status: 400 })
    }

    // Get contact by ID and user ID
    const contact = await db.getContactById(contactId, user.id)
    
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    return NextResponse.json({ contact })
  } catch (error) {
    console.error("[Contact API] Error fetching contact:", error)
    return NextResponse.json({ error: "Failed to fetch contact" }, { status: 500 })
  }
}

