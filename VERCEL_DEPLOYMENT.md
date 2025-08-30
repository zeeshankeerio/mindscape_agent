# 🚀 Vercel Deployment Guide for Mindscape Agent

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account**: Your code should be in a GitHub repository
3. **Custom Domain**: `agent.mindscapeanalytics.com` should be configured
4. **Environment Variables**: All Telnyx and Supabase credentials ready

## 🔧 Step 1: Prepare Your Repository

### 1.1 Commit and Push Your Code
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 1.2 Verify Project Structure
```
mindscape-agent/
├── app/                    # Next.js app directory
├── components/            # React components
├── lib/                   # Utility libraries
├── public/                # Static assets
├── package.json           # Dependencies
├── next.config.mjs        # Next.js config
├── vercel.json            # Vercel config
└── .env.local             # Environment variables
```

## 🌐 Step 2: Deploy to Vercel

### 2.1 Connect GitHub Repository
1. **Go to**: [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Click**: "New Project"
3. **Import**: Select your GitHub repository
4. **Configure**: 
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

### 2.2 Environment Variables Setup
In Vercel dashboard, add these environment variables:

#### **Telnyx Configuration**
```
TELNYX_API_KEY=KEY0198F806B5EE30E6D32639BA97DFD2A0_8lhEQ14iAN7p0j6S4eWord
TELNYX_PUBLIC_KEY=oP9PhmVO50j+FCbFJIO64ArbncEcnMHvn3ou0yoHAe8=
TELNYX_WEBHOOK_SIGNING_SECRET=dummy_signing_secret_9876543210
```

#### **Supabase Configuration**
```
NEXT_PUBLIC_SUPABASE_URL=https://ngdothjakhxkmiqcbbcl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=Tk7QsVWCBfzWu2Rphi+lYNt21aXHgFmnz3+9g6/KXnTV2nCcfR1G57X5zO+XwJ35qfoJ/+PvAbZfcYurkE2TPw==
```

#### **App Configuration**
```
NEXT_PUBLIC_APP_URL=https://agent.mindscapeanalytics.com
NODE_ENV=production
```

### 2.3 Deploy
1. **Click**: "Deploy"
2. **Wait**: For build to complete (usually 2-5 minutes)
3. **Verify**: Build success and deployment

## 🌍 Step 3: Configure Custom Domain

### 3.1 Add Domain in Vercel
1. **Go to**: Project Settings → Domains
2. **Add Domain**: `agent.mindscapeanalytics.com`
3. **Configure DNS**: Follow Vercel's DNS instructions

### 3.2 DNS Configuration
Add these DNS records to your domain provider:

#### **For mindscapeanalytics.com (Root Domain)**
```
Type: A
Name: @
Value: 76.76.19.76
```

#### **For agent.mindscapeanalytics.com (Subdomain)**
```
Type: CNAME
Name: agent
Value: cname.vercel-dns.com
```

### 3.3 Verify Domain
1. **Wait**: DNS propagation (up to 48 hours, usually 15 minutes)
2. **Check**: Domain status in Vercel dashboard
3. **Test**: Visit `https://agent.mindscapeanalytics.com`

## 🔗 Step 4: Update Telnyx Webhook

### 4.1 New Webhook URL
Once deployed, your webhook URL will be:
```
https://agent.mindscapeanalytics.com/api/webhooks/telnyx
```

### 4.2 Update in Telnyx Portal
1. **Go to**: [portal.telnyx.com](https://portal.telnyx.com)
2. **Navigate to**: Messaging → Messaging Profiles
3. **Edit Profile**: Update webhook URL to production URL
4. **Save**: Changes

## 🧪 Step 5: Test Production Deployment

### 5.1 Test App Access
- **URL**: `https://agent.mindscapeanalytics.com`
- **Login**: Use `mindscape` / `mindscape`
- **Verify**: All features working

### 5.2 Test SMS Functionality
- **Send SMS**: Use production webhook URL
- **Receive Webhooks**: Test inbound message processing
- **Database**: Verify message storage

### 5.3 Test API Endpoints
```bash
# Test connection
curl https://agent.mindscapeanalytics.com/api/test-connection

# Test database
curl https://agent.mindscapeanalytics.com/api/test-database

# Test SMS (with real phone number)
curl -X POST https://agent.mindscapeanalytics.com/api/simple-sms-test \
  -H "Content-Type: application/json" \
  -d '{"to":"+15551234567","text":"Hello from production!"}'
```

## 🔒 Step 6: Security & Production Considerations

### 6.1 Environment Variables
- ✅ **Never commit** `.env.local` to Git
- ✅ **Use Vercel** environment variables
- ✅ **Rotate** API keys regularly

### 6.2 Webhook Security
- ✅ **Validate** webhook signatures in production
- ✅ **Rate limiting** for webhook endpoints
- ✅ **HTTPS only** for all communications

### 6.3 Monitoring
- **Vercel Analytics**: Enable for performance monitoring
- **Error Tracking**: Monitor API errors and webhook failures
- **Uptime**: Check app availability

## 🚀 Step 7: Continuous Deployment

### 7.1 Automatic Deployments
- **Push to main**: Automatically deploys to production
- **Preview deployments**: Created for pull requests
- **Rollback**: Easy rollback to previous versions

### 7.2 Environment Management
- **Development**: `localhost:3001`
- **Staging**: Vercel preview deployments
- **Production**: `agent.mindscapeanalytics.com`

## 📱 Benefits of Vercel Deployment

1. **Global CDN**: Fast loading worldwide
2. **Automatic HTTPS**: SSL certificates included
3. **Custom Domain**: Professional branding
4. **Webhook Support**: Public URL for Telnyx
5. **Scalability**: Handles traffic spikes
6. **Monitoring**: Built-in analytics and logging

## 🎯 Next Steps After Deployment

1. **Test**: All functionality in production
2. **Monitor**: App performance and errors
3. **Configure**: Production webhook in Telnyx
4. **Document**: Production setup for team
5. **Backup**: Database and configuration

---

## 🆘 Troubleshooting

### Build Failures
- Check environment variables are set
- Verify all dependencies in `package.json`
- Check Next.js configuration

### Domain Issues
- Verify DNS records are correct
- Wait for DNS propagation
- Check domain status in Vercel

### Webhook Issues
- Verify webhook URL is accessible
- Check Telnyx webhook configuration
- Monitor Vercel function logs

---

**Your Mindscape Agent will be live at: `https://agent.mindscapeanalytics.com`** 🎉
