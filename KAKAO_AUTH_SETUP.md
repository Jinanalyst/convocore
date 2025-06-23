# KakaoTalk Authentication Setup Guide

## Overview

This guide will help you set up KakaoTalk authentication for both mobile and desktop platforms in Convocore. KakaoTalk is the most popular messaging app in South Korea with over 47 million users.

## Current Status: ⚠️ Configuration Required

The Kakao login is currently showing error code KOE205, which indicates that Kakao OAuth is not properly configured in Supabase.

## Prerequisites

- Supabase account with admin access
- KakaoTalk Developers Console account
- Domain verification for production use

## 🔧 Setup Instructions

### 1. Supabase Configuration

1. **Access Supabase Dashboard**
   - Go to: [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Navigate to your project → Authentication → Settings

2. **Enable Kakao Authentication**
   - Scroll to "Third-party providers"
   - Find "Kakao" in the provider list
   - Toggle the switch to enable it

3. **Configure Kakao Provider Settings**
   - Add your Kakao credentials:
   ```
   🔐 Client ID: [Your Kakao App Key]
   🔑 Client Secret: [Your Kakao App Secret]
   ```

### 2. Kakao Developers Console Setup

1. **Create/Access Kakao App**
   - Go to: [https://developers.kakao.com](https://developers.kakao.com)
   - Sign in with your Kakao account
   - Create a new app or select existing one

2. **Configure OAuth Settings**
   ```
   App Name: Convocore
   Platform: Web
   Site Domain: https://convocore.site
   Redirect URI: https://convocore.site/auth/callback
   ```

3. **Mobile App Configuration**
   ```
   iOS Bundle ID: com.convocore.app (if applicable)
   Android Package Name: com.convocore.app (if applicable)
   ```

4. **Enable Required Scopes**
   - Check the following permissions:
   ```
   ✅ profile_nickname (Get user nickname)
   ✅ profile_image (Get user profile image)
   ✅ account_email (Get user email)
   ```

5. **Configure Domains**
   ```
   Web Platform Domain: https://convocore.site
   JavaScript Domain: https://convocore.site
   ```

### 3. Environment Variables

Add these to your `.env.local` file:

```bash
# Kakao OAuth Configuration
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_kakao_app_key
KAKAO_CLIENT_SECRET=your_kakao_app_secret
NEXT_PUBLIC_KAKAO_REDIRECT_URI=https://convocore.site/auth/callback
```

### 4. Mobile-Specific Configuration

#### iOS Configuration
```bash
# Add to Info.plist if using native app
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>kakao</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>kakao{your_app_key}</string>
        </array>
    </dict>
</array>
```

#### Android Configuration
```xml
<!-- Add to AndroidManifest.xml if using native app -->
<activity android:name="com.kakao.sdk.auth.AuthCodeHandlerActivity">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:host="oauth" android:scheme="kakao{your_app_key}" />
    </intent-filter>
</activity>
```

## 📱 Mobile vs Desktop Behavior

### Desktop Experience
- Opens Kakao OAuth in new browser tab
- Returns to main application after authentication
- Supports all major browsers (Chrome, Firefox, Safari, Edge)

### Mobile Experience
- Attempts to open KakaoTalk app if installed
- Falls back to mobile web browser if app not available
- Optimized touch interface for mobile devices
- Enhanced error handling for mobile-specific issues

## 🚨 Common Issues & Solutions

### Error: KOE205 - Authentication Service Not Configured
**Solution:** Enable Kakao in Supabase Authentication Providers

### Error: Invalid Redirect URI
**Solution:** Ensure redirect URIs match exactly in both Kakao and Supabase

### Error: Domain Not Verified
**Solution:** Verify domain ownership in Kakao Developers Console

### Mobile App Not Opening
**Solution:** 
- Ensure Kakao app is published (not in development mode)
- Check deep link configuration
- Verify domain settings in Kakao console

## ✅ Testing Checklist

- [ ] Kakao app created and configured
- [ ] Supabase Kakao provider enabled
- [ ] Environment variables set correctly
- [ ] Redirect URIs configured properly
- [ ] App published in Kakao console
- [ ] Domain verification completed
- [ ] Mobile deep links tested
- [ ] Desktop browser flow tested

## 🔄 Quick Commands

```bash
# Set up environment variables
echo "NEXT_PUBLIC_KAKAO_CLIENT_ID=your_app_key" >> .env.local
echo "KAKAO_CLIENT_SECRET=your_app_secret" >> .env.local
echo "NEXT_PUBLIC_KAKAO_REDIRECT_URI=https://convocore.site/auth/callback" >> .env.local

# Restart development server
npm run dev
```

## 📞 Support & Fallbacks

If Kakao setup is complex, users can use:
1. **Google Authentication** (Primary fallback)
2. **Wallet Connection** (Crypto users)
3. **Magic Link Email** (Universal fallback)

### Mobile Fallback Flow
```
1. Try Kakao login
2. If failed → Show Google login option
3. If Google failed → Show wallet connection
4. If all failed → Show magic link option
```

## 🧪 Testing Authentication

```javascript
// Try Kakao login
await signInWithKakao();

// Fallback to Google
if (kakaoFailed) {
  await signInWithGoogle();
}

// Final fallback to wallet
if (googleFailed) {
  showWalletConnector();
}
```

## 📊 Analytics & Monitoring

Track authentication success rates:
- Kakao login attempts vs success
- Mobile vs desktop usage patterns
- Error frequency and types
- User preference patterns

## 🌐 Internationalization

Support for multiple languages:
- Korean (primary for Kakao users)
- English (international users)
- Japanese (regional expansion)

## 🔒 Security Considerations

- HTTPS required for all OAuth flows
- Proper CORS configuration
- Secure storage of tokens
- Regular security audits
- User data privacy compliance

---

*Last updated: January 2024*
*For technical support: [support@convocore.site](mailto:support@convocore.site)* 