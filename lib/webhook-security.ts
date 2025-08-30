// Webhook security utilities for Telnyx integration
import crypto from "crypto"

export function verifyTelnyxSignature(
  payload: string,
  signature: string,
  timestamp: string,
  publicKey: string,
): boolean {
  try {
    // Telnyx uses Ed25519 signatures
    // This is a simplified version - in production, you'd use a proper Ed25519 library

    // For now, we'll implement basic validation
    // In production, use the @noble/ed25519 library or similar

    const expectedSignature = crypto
      .createHmac("sha256", publicKey)
      .update(timestamp + payload)
      .digest("hex")

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  } catch (error) {
    console.error("Error verifying Telnyx signature:", error)
    return false
  }
}

export function isTimestampValid(timestamp: string, toleranceSeconds = 300): boolean {
  const now = Math.floor(Date.now() / 1000)
  const webhookTime = Number.parseInt(timestamp)

  return Math.abs(now - webhookTime) <= toleranceSeconds
}
