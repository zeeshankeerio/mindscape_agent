# 📱 SMS Reception Testing Guide

## 🎯 **How to Test if Your App Can Receive SMS**

### **Prerequisites ✅**
- ✅ Telnyx webhook configured
- ✅ App running on `http://localhost:3000`
- ✅ Database connected
- ✅ Your Telnyx number: `+13076249136`

---

## 🧪 **Method 1: Real SMS Test (Recommended)**

### **Step 1: Send Real SMS**
1. **From your phone**: Send SMS to `+13076249136`
2. **Message content**: "Hello Mindscape Agent! This is a test message."
3. **Expected result**: Message appears in your dashboard

### **Step 2: Check Dashboard**
1. **Open app**: `http://localhost:3000`
2. **Login**: `mindscape` / `mindscape`
3. **Look for**: New contact and message in the list
4. **Check**: Message appears in real-time

### **Step 3: Monitor Terminal**
- **Watch for**: Webhook processing logs
- **Look for**: `[Telnyx Webhook] Processing incoming message`
- **Verify**: Contact creation and message storage

---

## 🧪 **Method 2: API Testing**

### **Test 1: Check Current Status**
```bash
GET http://localhost:3000/api/test-sms-reception
```

**Expected Response:**
```json
{
  "success": true,
  "configuration": {
    "telnyxNumber": "+13076249136",
    "webhookUrl": "https://agent.mindscapeanalytics.com/api/webhooks/telnyx",
    "isActive": true
  }
}
```

### **Test 2: Simulate Incoming SMS**
```bash
POST http://localhost:3000/api/test-sms-reception
Content-Type: application/json

{
  "action": "simulate_incoming_sms",
  "phoneNumber": "+1234567890",
  "messageText": "Test message from API simulation"
}
```

### **Test 3: Check Database**
```bash
POST http://localhost:3000/api/test-sms-reception
Content-Type: application/json

{
  "action": "check_database"
}
```

---

## 🧪 **Method 3: Webhook Testing**

### **Test Webhook Endpoint**
```bash
POST http://localhost:3000/api/webhooks/telnyx
Content-Type: application/json

{
  "data": {
    "event_type": "message.received",
    "id": "test-webhook-123",
    "occurred_at": "2025-01-27T10:00:00Z",
    "payload": {
      "id": "test-message-123",
      "record_type": "message",
      "direction": "inbound",
      "message_type": "SMS",
      "from": { "phone_number": "+1234567890" },
      "to": { "phone_number": "+13076249136" },
      "text": "Test webhook message",
      "received_at": "2025-01-27T10:00:00Z"
    }
  }
}
```

---

## 🔍 **What to Look For**

### **✅ Success Indicators:**
1. **Terminal Logs**: Webhook processing messages
2. **Dashboard**: New contact appears
3. **Messages**: Incoming message visible
4. **Database**: Message stored successfully
5. **Real-time**: SSE updates working

### **❌ Failure Indicators:**
1. **No webhook logs**: Webhook not receiving
2. **No new contacts**: Contact creation failed
3. **No messages**: Message storage failed
4. **Errors in terminal**: Check error messages

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: Webhook Not Receiving**
- **Check**: Telnyx webhook URL configuration
- **Verify**: `https://agent.mindscapeanalytics.com/api/webhooks/telnyx`
- **Test**: Use webhook.site for external testing

### **Issue 2: Messages Not Appearing**
- **Check**: Database connection
- **Verify**: User ID mapping
- **Test**: Database API endpoints

### **Issue 3: Contacts Not Creating**
- **Check**: Phone number validation
- **Verify**: Database permissions
- **Test**: Contact creation API

---

## 📊 **Testing Checklist**

- [ ] **Webhook accessible**: `/api/webhooks/telnyx` responds
- [ ] **Database connected**: Can create/read contacts and messages
- [ ] **Real SMS received**: Message from phone appears in app
- [ ] **Contact created**: New contact appears in list
- [ ] **Message stored**: Message content visible in thread
- [ ] **Real-time updates**: SSE working for live updates
- [ ] **OTP detection**: 4-6 digit codes detected properly

---

## 🎯 **Quick Test Commands**

### **Using curl:**
```bash
# Check status
curl http://localhost:3000/api/test-sms-reception

# Simulate SMS
curl -X POST http://localhost:3000/api/test-sms-reception \
  -H "Content-Type: application/json" \
  -d '{"action":"simulate_incoming_sms","phoneNumber":"+1234567890","messageText":"Test message"}'

# Test webhook
curl -X POST http://localhost:3000/api/webhooks/telnyx \
  -H "Content-Type: application/json" \
  -d '{"data":{"event_type":"message.received","id":"test-123","occurred_at":"2025-01-27T10:00:00Z","payload":{"id":"msg-123","record_type":"message","direction":"inbound","message_type":"SMS","from":{"phone_number":"+1234567890"},"to":{"phone_number":"+13076249136"},"text":"Test","received_at":"2025-01-27T10:00:00Z"}}}'
```

---

## 🔧 **Debugging Tips**

1. **Check terminal logs** for webhook processing
2. **Monitor database** for new records
3. **Test API endpoints** individually
4. **Verify environment variables** are set
5. **Check Telnyx portal** for webhook delivery status

---

## 📞 **Need Help?**

If testing fails:
1. **Check terminal logs** for error messages
2. **Verify webhook URL** in Telnyx portal
3. **Test API endpoints** for connectivity
4. **Check database** for proper setup

**Your app should now be able to receive SMS properly!** 📱✅
