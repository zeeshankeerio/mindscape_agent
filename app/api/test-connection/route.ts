import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing",
      },
      telnyx: {
        apiKey: process.env.TELNYX_API_KEY ? "✅ Set" : "❌ Missing",
        publicKey: process.env.TELNYX_PUBLIC_KEY ? "✅ Set" : "❌ Missing",
        webhookSecret: process.env.TELNYX_WEBHOOK_SIGNING_SECRET ? "✅ Set" : "❌ Missing",
      },
      app: {
        url: process.env.NEXT_PUBLIC_APP_URL ? "✅ Set" : "❌ Missing",
        nodeEnv: process.env.NODE_ENV || "❌ Missing",
      }
    }

    // Test Supabase connection
    let supabaseConnection = "❌ Not tested"
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          }
        })
        supabaseConnection = response.ok ? "✅ Connected" : `❌ Failed (${response.status})`
      } catch (error) {
        supabaseConnection = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }

    // Test Telnyx connection
    let telnyxConnection = "❌ Not tested"
    if (process.env.TELNYX_API_KEY) {
      try {
        const response = await fetch('https://api.telnyx.com/v2/messaging_profiles', {
          headers: {
            'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })
        telnyxConnection = response.ok ? "✅ Connected" : `❌ Failed (${response.status})`
      } catch (error) {
        telnyxConnection = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      connections: {
        supabase: supabaseConnection,
        telnyx: telnyxConnection
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
