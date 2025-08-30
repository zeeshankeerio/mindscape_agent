# Telnyx Integration Setup Guide

This guide will help you configure Telnyx messaging integration for Mindscape Agent.

## Prerequisites

1. A Telnyx account with messaging services enabled
2. A phone number purchased through Telnyx
3. A publicly accessible webhook URL (use ngrok for local development)

## Step 1: Get Your API Credentials

1. Log into your Telnyx Mission Control Portal
2. Navigate to **API Keys** in the left sidebar
3. Create a new API key or copy your existing one
4. Add it to your environment variables as `TELNYX_API_KEY`

## Step 2: Configure Webhook Settings

1. In Telnyx Mission Control, go to **Messaging** > **Messaging Profiles**
2. Create a new messaging profile or edit an existing one
3. Set the webhook URL to: `https://yourdomain.com/api/webhooks/telnyx`
   - For local development with ngrok: `https://your-ngrok-url.ngrok.io/api/webhooks/telnyx`
4. Enable the following webhook events:
   - `message.received` - For incoming SMS/MMS
   - `message.sent` - For outbound message confirmations
   - `message.delivered` - For delivery receipts
   - `message.delivery_failed` - For failed deliveries

## Step 3: Configure Webhook Security

1. In your messaging profile settings, find the **Webhook Signing Secret**
2. Copy this secret and add it to your environment variables as `TELNYX_WEBHOOK_SIGNING_SECRET`
3. This ensures webhook authenticity and prevents unauthorized requests

## Step 4: Assign Phone Numbers

1. Go to **Numbers** > **My Numbers** in Telnyx Mission Control
2. Select your phone number(s)
3. In the **Messaging** section, assign them to your messaging profile
4. Ensure the messaging profile has the correct webhook URL configured

## Step 5: Test Your Integration

1. Send a test SMS to your Telnyx phone number
2. Check your application logs for webhook events
3. Verify messages appear in your Mindscape Agent interface
4. Test sending outbound messages from the app

## Environment Variables

Add these to your `.env.local` file:

\`\`\`env
TELNYX_API_KEY=your_api_key_here
TELNYX_WEBHOOK_SIGNING_SECRET=your_webhook_signing_secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com
\`\`\`

## Webhook URL Format

Your webhook endpoint will be available at:
- Production: `https://yourdomain.com/api/webhooks/telnyx`
- Development: `https://your-ngrok-url.ngrok.io/api/webhooks/telnyx`

## Troubleshooting

### Messages Not Receiving
- Verify webhook URL is publicly accessible
- Check that messaging profile is assigned to your phone number
- Ensure webhook events are enabled in your messaging profile
- Check application logs for webhook processing errors

### Webhook Signature Validation Failing
- Verify `TELNYX_WEBHOOK_SIGNING_SECRET` matches your messaging profile
- Ensure the secret is correctly configured in your environment
- Check that webhook timestamps are within the 5-minute tolerance window

### Outbound Messages Failing
- Verify `TELNYX_API_KEY` has messaging permissions
- Check that your account has sufficient balance
- Ensure phone numbers are in the correct format (+1XXXXXXXXXX)
- Review Telnyx API error messages in application logs

## IP Whitelisting

If you use a firewall, whitelist the Telnyx webhook IP subnet:
`192.76.120.192/27`

## Rate Limits

Telnyx has the following rate limits:
- 100 requests per second for messaging API
- Webhook retries follow exponential backoff

For more information, visit the [Telnyx Documentation](https://developers.telnyx.com/docs/messaging).
