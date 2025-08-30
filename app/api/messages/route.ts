import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { getHardcodedUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = getHardcodedUser()
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get("contact_id")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const messages = await db.getMessages(user.id, contactId ? Number.parseInt(contactId) : undefined, limit)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("[Messages API] Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}
