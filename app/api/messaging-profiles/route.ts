import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { getHardcodedUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = getHardcodedUser()
    const profiles = await db.getMessagingProfiles(user.id)
    return NextResponse.json({ profiles })
  } catch (error) {
    console.error("[Messaging Profiles API] Error fetching profiles:", error)
    return NextResponse.json({ error: "Failed to fetch messaging profiles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getHardcodedUser()
    const { profile_id, name, webhook_url, webhook_failover_url } = await request.json()

    if (!profile_id || !name) {
      return NextResponse.json({ error: "Profile ID and name are required" }, { status: 400 })
    }

    const profile = await db.createMessagingProfile({
      profile_id,
      name,
      webhook_url,
      webhook_failover_url,
      is_active: true,
      user_id: user.id,
    })

    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    console.error("[Messaging Profiles API] Error creating profile:", error)
    return NextResponse.json({ error: "Failed to create messaging profile" }, { status: 500 })
  }
}

