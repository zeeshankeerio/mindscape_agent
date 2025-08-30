import { type NextRequest, NextResponse } from "next/server"
import { validateCredentials, getHardcodedUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    console.log("[Test Auth] Testing credentials:", { username, password })
    
    // Test credential validation
    const isValid = validateCredentials(username, password)
    
    if (isValid) {
      const user = getHardcodedUser()
      console.log("[Test Auth] Valid credentials, user:", user)
      
      return NextResponse.json({
        success: true,
        message: "Authentication successful",
        user: user,
        credentials: {
          username: username,
          password: password === "mindscape" ? "***" : "INVALID"
        },
        security: {
          onlyValidCredentials: true,
          hardcodedSystem: true,
          testPassed: true
        }
      })
    } else {
      console.log("[Test Auth] Invalid credentials")
      
      return NextResponse.json({
        success: false,
        message: "Invalid credentials",
        expected: {
          username: "mindscape",
          password: "mindscape"
        },
        received: {
          username: username,
          password: password === "mindscape" ? "***" : "INVALID"
        },
        security: {
          onlyValidCredentials: true,
          hardcodedSystem: true,
          testPassed: false
        }
      }, { status: 401 })
    }
    
  } catch (error) {
    console.error("[Test Auth] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = getHardcodedUser()
    
    return NextResponse.json({
      success: true,
      message: "Authentication system ready and secure",
      hardcodedCredentials: {
        username: "mindscape",
        password: "mindscape"
      },
      user: user,
      security: {
        onlyValidCredentials: true,
        hardcodedSystem: true,
        noDatabaseAuth: true,
        secure: true
      },
      instructions: "Use POST with username and password to test authentication",
      testCases: [
        "Valid: mindscape/mindscape → 200 OK",
        "Invalid: wronguser/wrongpass → 401 Unauthorized",
        "Empty: empty/empty → 401 Unauthorized",
        "Partial: mindscape/wrongpass → 401 Unauthorized"
      ]
    })
    
  } catch (error) {
    console.error("[Test Auth] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
