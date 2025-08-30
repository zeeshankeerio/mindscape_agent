import { type NextRequest, NextResponse } from "next/server"
import { 
  formatPhoneNumber, 
  displayPhoneNumber, 
  isValidPhoneNumber, 
  parsePhoneNumberInput, 
  normalizePhoneNumber 
} from "@/lib/telnyx"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumbers } = await request.json()

    if (!Array.isArray(phoneNumbers)) {
      return NextResponse.json({ 
        error: "phoneNumbers must be an array" 
      }, { status: 400 })
    }

    const results = phoneNumbers.map((input: string) => {
      try {
        const isValid = isValidPhoneNumber(input)
        const formatted = formatPhoneNumber(input)
        const displayed = displayPhoneNumber(input)
        const parsed = parsePhoneNumberInput(input)
        const normalized = normalizePhoneNumber(input)

        return {
          input,
          isValid,
          formatted,
          displayed,
          parsed,
          normalized,
          success: true
        }
      } catch (error) {
        return {
          input,
          error: error instanceof Error ? error.message : "Unknown error",
          success: false
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Phone number formatting test completed",
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })

  } catch (error) {
    console.error("[Test Phone Format] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET() {
  // Test with common phone number formats
  const testNumbers = [
    // US numbers
    "3076249136",
    "13076249136", 
    "+13076249136",
    "(307) 624-9136",
    "307-624-9136",
    "307.624.9136",
    "307 624 9136",
    
    // International numbers
    "+447911123456",
    "447911123456",
    "+81-3-1234-5678",
    "81312345678",
    
    // Edge cases
    "1234567890",
    "+1234567890",
    "123456789",
    "123456789012345",
    
    // Invalid formats
    "abc",
    "123",
    "1234567890123456",
    "",
    "null",
    "undefined"
  ]

  const results = testNumbers.map((input: string) => {
    try {
      const isValid = isValidPhoneNumber(input)
      let formatted = ""
      let displayed = ""
      let parsed = ""
      let normalized = ""

      try {
        formatted = formatPhoneNumber(input)
        displayed = displayPhoneNumber(input)
        parsed = parsePhoneNumberInput(input)
        normalized = normalizePhoneNumber(input)
      } catch (error) {
        // Expected for invalid numbers
      }

      return {
        input,
        isValid,
        formatted: formatted || "N/A",
        displayed: displayed || "N/A", 
        parsed: parsed || "N/A",
        normalized: normalized || "N/A",
        success: true
      }
    } catch (error) {
      return {
        input,
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      }
    }
  })

  return NextResponse.json({
    success: true,
    message: "Phone number formatting test with sample data",
    testNumbers: testNumbers,
    results,
    summary: {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      valid: results.filter(r => r.isValid).length,
      invalid: results.filter(r => !r.isValid).length
    },
    examples: {
      usNumber: "3076249136 → +13076249136",
      internationalNumber: "447911123456 → +447911123456",
      displayFormat: "+13076249136 → (307) 624-9136"
    }
  })
}
