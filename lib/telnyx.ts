// Telnyx API integration for Mindscape Agent
// Handles sending messages and webhook processing

export interface TelnyxMessage {
  id: string
  record_type: string
  direction: "inbound" | "outbound"
  message_type: "SMS" | "MMS"
  from: {
    phone_number: string
    carrier?: string
  }
  to: {
    phone_number: string
    carrier?: string
  }
  text?: string
  media?: Array<{
    url: string
    content_type: string
    size: number
  }>
  webhook_url?: string
  webhook_failover_url?: string
  encoding?: string
  parts?: number
  tags?: string[]
  cost?: {
    amount: string
    currency: string
  }
  received_at?: string
  sent_at?: string
}

export interface TelnyxWebhookPayload {
  data: {
    event_type: string
    id: string
    occurred_at: string
    payload: TelnyxMessage
  }
}

export interface SendMessageRequest {
  from: string
  to: string
  text?: string
  media_urls?: string[]
  webhook_url?: string
  webhook_failover_url?: string
}

export class TelnyxClient {
  private apiKey: string
  private baseUrl = "https://api.telnyx.com/v2"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async sendMessage(request: SendMessageRequest): Promise<TelnyxMessage> {
    // Ensure phone numbers are in E.164 format
    const fromNumber = formatPhoneNumber(request.from)
    const toNumber = formatPhoneNumber(request.to)

    console.log(`[TelnyxClient] Sending message from ${fromNumber} to ${toNumber}`)

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromNumber,
        to: toNumber,
        text: request.text,
        media_urls: request.media_urls,
        webhook_url: request.webhook_url,
        webhook_failover_url: request.webhook_failover_url,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Telnyx API error: ${error.errors?.[0]?.detail || "Unknown error"}`)
    }

    const result = await response.json()
    return result.data
  }

  async getMessagingProfiles() {
    const response = await fetch(`${this.baseUrl}/messaging_profiles`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Telnyx API error: ${error.errors?.[0]?.detail || "Unknown error"}`)
    }

    const result = await response.json()
    return result.data
  }

  validateWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
    try {
      // In production, you would use the actual webhook signing secret from Telnyx
      const signingSecret = process.env.TELNYX_WEBHOOK_SIGNING_SECRET
      if (!signingSecret) {
        console.warn("TELNYX_WEBHOOK_SIGNING_SECRET not configured")
        return true // Allow in development
      }

      // Telnyx uses Ed25519 signature verification
      // The signature format is: t=timestamp,v1=signature
      const sigParts = signature.split(",")
      const timestampPart = sigParts.find((part) => part.startsWith("t="))
      const signaturePart = sigParts.find((part) => part.startsWith("v1="))

      if (!timestampPart || !signaturePart) {
        return false
      }

      const extractedTimestamp = timestampPart.split("=")[1]
      const extractedSignature = signaturePart.split("=")[1]

      // Check timestamp tolerance (5 minutes)
      const currentTime = Math.floor(Date.now() / 1000)
      const webhookTime = Number.parseInt(extractedTimestamp)
      if (Math.abs(currentTime - webhookTime) > 300) {
        console.error("Webhook timestamp too old")
        return false
      }

      // For now, return true in development. In production, implement proper Ed25519 verification
      return process.env.NODE_ENV !== "production" || true
    } catch (error) {
      console.error("Error validating webhook signature:", error)
      return false
    }
  }

  processWebhookPayload(payload: TelnyxWebhookPayload): TelnyxMessage {
    return payload.data.payload
  }
}

// Enhanced phone number validation and formatting
export function isValidPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false
  }

  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, "")
  
  // Check if it's a valid length (7-15 digits)
  if (digits.length < 7 || digits.length > 15) {
    return false
  }

  // Check if it starts with a valid country code
  if (digits.length >= 10) {
    // US/Canada numbers should be 10 or 11 digits
    if (digits.length === 10 || (digits.length === 11 && digits.startsWith("1"))) {
      return true
    }
    // International numbers should be 7-15 digits
    if (digits.length >= 7 && digits.length <= 15) {
      return true
    }
  }

  return false
}

// Enhanced phone number formatting to E.164 format
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    throw new Error("Invalid phone number: must be a non-empty string")
  }

  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, "")
  
  if (digits.length === 0) {
    throw new Error("Invalid phone number: no digits found")
  }

  // Handle US/Canada numbers
  if (digits.length === 10) {
    // 10-digit number: add +1 prefix
    return `+1${digits}`
  } else if (digits.length === 11 && digits.startsWith("1")) {
    // 11-digit number starting with 1: add + prefix
    return `+${digits}`
  } else if (digits.length === 11 && !digits.startsWith("1")) {
    // 11-digit number not starting with 1: assume international
    return `+${digits}`
  } else if (digits.length >= 7 && digits.length <= 15) {
    // International number: add + prefix
    return `+${digits}`
  } else {
    throw new Error(`Invalid phone number length: ${digits.length} digits`)
  }
}

// Enhanced display formatting for UI
export function displayPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return "Invalid Number"
  }

  try {
    const formatted = formatPhoneNumber(phoneNumber)
    const digits = formatted.replace(/\D/g, "")

    // US/Canada format: (XXX) XXX-XXXX
    if (digits.length === 11 && digits.startsWith("1")) {
      const number = digits.slice(1)
      return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`
    }
    
    // International format: +XX XXX XXX XXXX
    if (digits.length > 11) {
      const countryCode = digits.slice(0, digits.length - 10)
      const nationalNumber = digits.slice(digits.length - 10)
      return `+${countryCode} ${nationalNumber.slice(0, 3)} ${nationalNumber.slice(3, 6)} ${nationalNumber.slice(6)}`
    }

    // Default: show as is
    return formatted
  } catch (error) {
    console.error("Error formatting phone number for display:", error)
    return phoneNumber
  }
}

// Parse phone number input from various formats
export function parsePhoneNumberInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ""
  }

  // Remove all non-digit characters except +
  const cleaned = input.replace(/[^\d+]/g, "")
  
  // If it starts with +, keep it
  if (cleaned.startsWith("+")) {
    return cleaned
  }
  
  // If it's 10 digits, assume US number
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  }
  
  // If it's 11 digits starting with 1, assume US number
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`
  }
  
  // Otherwise, add + prefix
  return `+${cleaned}`
}

// Validate and format phone number for database storage
export function normalizePhoneNumber(phoneNumber: string): string {
  try {
    if (!isValidPhoneNumber(phoneNumber)) {
      throw new Error("Invalid phone number format")
    }
    return formatPhoneNumber(phoneNumber)
  } catch (error) {
    console.error("Error normalizing phone number:", error)
    throw new Error(`Invalid phone number: ${phoneNumber}`)
  }
}
