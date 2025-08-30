import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { getHardcodedUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = getHardcodedUser()
    const settings = await db.getInboundSettings(user.id)
    return NextResponse.json({ settings })
  } catch (error) {
    console.error("[Inbound Settings API] Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = getHardcodedUser()
    const updates = await request.json()

    const settings = await db.updateInboundSettings(updates, user.id)

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("[Inbound Settings API] Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
