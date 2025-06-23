# Kakao Authentication Setup Guide

## 🚨 Current Issue: KOE205 Error
The Kakao login is failing with error code KOE205, which indicates that Kakao OAuth is not properly configured in Supabase.

## 🔧 Step-by-Step Fix

### 1. Supabase Dashboard Configuration

1. **Go to your Supabase Dashboard**
   - Navigate to: [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your ConvoCore project

2. **Enable Kakao Authentication**
   - Go to `Authentication` → `Providers`
   - Find "Kakao" in the provider list
   - Toggle it **ON**

3. **Configure Kakao Provider Settings**
   ```
   ✅ Enabled: ON
   🔐 Client ID: [Your Kakao App Key]
   🔑 Client Secret: [Your Kakao App Secret]
   🔗 Redirect URL: https://[your-project-ref].supabase.co/auth/v1/callback
   ```

### 2. Kakao Developers Console Setup

1. **Create/Access Kakao App**
   - Go to: [https://developers.kakao.com](https://developers.kakao.com)
   - Create a new app or access existing one

2. **Configure OAuth Settings**
   ```
   App Key (REST API Key): [Copy this to Supabase Client ID]
   App Secret: [Generate and copy to Supabase Client Secret]
   
   Redirect URIs:
   - https://[your-project-ref].supabase.co/auth/v1/callback
   - http://localhost:54321/auth/v1/callback (for local development)
   ```

3. **Enable Required Scopes**
   - `profile_nickname`
   - `account_email`
   - `profile_image`

## 🛠️ Quick Fix Commands

```bash
# Add environment variables
echo "NEXT_PUBLIC_KAKAO_CLIENT_ID=your_kakao_app_key" >> .env.local
echo "KAKAO_CLIENT_SECRET=your_kakao_app_secret" >> .env.local

# Restart development server
npm run dev
```

## 📞 Immediate Solution
If Kakao setup is complex, users can use:
1. **Google authentication** (should work)
2. **Wallet authentication** (bypass OAuth entirely)
3. **Demo mode** (continue without login)

## 🔍 Testing Steps

1. **Local Testing**
   ```bash
   npm run dev
   # Visit http://localhost:3000/auth/login
   # Try Kakao login
   ```

2. **Production Testing**
   ```bash
   # Deploy to Vercel
   vercel --prod
   # Test on live site
   ```

## 🐛 Common Issues & Solutions

### Issue 1: "Provider not enabled"
**Solution:** Enable Kakao in Supabase Authentication Providers

### Issue 2: "Invalid redirect URI"
**Solution:** Ensure redirect URIs match exactly in both Kakao and Supabase

### Issue 3: "Invalid client credentials"
**Solution:** Double-check Client ID and Secret in both platforms

### Issue 4: KOE205 Error
**Solution:** 
- Ensure Kakao app is published (not in development mode)
- Check that all required scopes are approved
- Verify domain settings in Kakao console

## 📋 Quick Checklist

- [ ] Kakao app created and configured
- [ ] Supabase Kakao provider enabled
- [ ] Environment variables set
- [ ] Redirect URIs match
- [ ] Required scopes enabled
- [ ] App published in Kakao console

## 🚀 Immediate Fix Commands

```bash
# 1. Check current Supabase configuration
npx supabase status

# 2. Update environment variables
echo "NEXT_PUBLIC_KAKAO_CLIENT_ID=your_app_key" >> .env.local
echo "KAKAO_CLIENT_SECRET=your_app_secret" >> .env.local

# 3. Restart development server
npm run dev
```

## 📞 Support

If you continue experiencing issues:
1. Check Supabase Auth logs
2. Check Kakao Developer Console logs
3. Test with Google authentication as fallback
4. Use wallet authentication as alternative 