import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET() {
  try {
    console.log("[Test Database] Starting database connectivity test...")
    
    // Test 1: Get contacts
    console.log("[Test Database] Testing contacts table...")
    const contacts = await db.getContacts("mindscape-user-1")
    console.log("[Test Database] Found contacts:", contacts.length)
    
    // Test 2: Get messaging profiles
    console.log("[Test Database] Testing messaging profiles table...")
    const profiles = await db.getMessagingProfiles("mindscape-user-1")
    console.log("[Test Database] Found profiles:", profiles.length)
    
    // Test 3: Get inbound settings
    console.log("[Test Database] Testing inbound settings table...")
    const settings = await db.getInboundSettings("mindscape-user-1")
    console.log("[Test Database] Found settings:", settings ? "Yes" : "No")
    
    // Test 4: Get messages
    console.log("[Test Database] Testing messages table...")
    const messages = await db.getMessages("mindscape-user-1")
    console.log("[Test Database] Found messages:", messages.length)
    
    return NextResponse.json({
      success: true,
      database: "✅ Connected and working",
      tables: {
        contacts: `✅ ${contacts.length} contacts found`,
        messagingProfiles: `✅ ${profiles.length} profiles found`,
        inboundSettings: settings ? "✅ Settings found" : "❌ No settings found",
        messages: `✅ ${messages.length} messages found`
      },
      sampleData: {
        contacts: contacts.slice(0, 2), // Show first 2 contacts
        profiles: profiles.slice(0, 2), // Show first 2 profiles
        settings: settings,
        messageCount: messages.length
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("[Test Database] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
