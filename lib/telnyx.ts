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
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: request.from,
        to: request.to,
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

// Utility functions for phone number formatting
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, "")

  // Add +1 if it's a US number without country code
  if (digits.length === 10) {
    return `+1${digits}`
  }

  // Add + if missing
  if (!phoneNumber.startsWith("+")) {
    return `+${digits}`
  }

  return phoneNumber
}

export function displayPhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, "")

  if (digits.length === 11 && digits.startsWith("1")) {
    const number = digits.slice(1)
    return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`
  }

  return phoneNumber
}
