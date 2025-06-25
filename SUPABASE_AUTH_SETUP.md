# Supabase Google Authentication Setup Guide

## Issue: "validation_failed" - "Unsupported provider: provider is not enabled"

This error occurs when Google OAuth is not properly configured in your Supabase project. Here's how to fix it:

## Step 1: Enable Google OAuth in Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Sign in to your account
   - Select your project

2. **Navigate to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "Providers" tab
   - Look for "Google" in the list of providers

3. **Enable Google Provider**
   - Toggle the "Google" switch to ON
   - You'll see a form asking for configuration

## Step 2: Set Up Google OAuth Credentials

### 2.1 Create Google OAuth App (if you haven't already)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Create a new project or select existing one

2. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Fill in required fields:
     - App name: "Convocore AI"
     - User support email: your email
     - Developer contact: your email

4. **Create OAuth Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Convocore Web Client"
   - Authorized redirect URIs: `https://YOUR_SUPABASE_URL/auth/v1/callback`
     - Replace YOUR_SUPABASE_URL with your actual Supabase URL
     - Example: `https://abcdefgh.supabase.co/auth/v1/callback`

### 2.2 Configure Google Provider in Supabase

1. **Copy Google Credentials**
   - From Google Cloud Console, copy:
     - Client ID
     - Client Secret

2. **Add to Supabase**
   - In Supabase Dashboard > Authentication > Providers > Google
   - Paste Client ID and Client Secret
   - Click "Save"

## Step 3: Update Environment Variables

Create or update your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

## Step 4: Verify Configuration

### 4.1 Check Supabase Configuration
- In Supabase Dashboard > Settings > API
- Copy your Project URL and anon key
- Make sure they match your .env.local file

### 4.2 Test Google Login
- Restart your development server: `npm run dev`
- Try the Google login button
- Should redirect to Google OAuth flow

## Step 5: Alternative Solution (If Supabase is Not Needed)

If you don't want to use Supabase for authentication, you can disable Google login:

### 5.1 Hide Google Login Button
Update `my-app/src/app/auth/login/page.tsx`:

```typescript
// Add this check before rendering Google login button
const showGoogleLogin = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Then conditionally render:
{showGoogleLogin && (
  <Button
    type="button"
    variant="outline"
    className="w-full"
    onClick={handleGoogleLogin}
    disabled={loading}
  >
    {/* Google login content */}
  </Button>
)}
```

### 5.2 Use Wallet-Only Authentication
The app already supports TRON wallet authentication which doesn't require Supabase.

## Step 6: Database Setup (Optional)

If you want to use Supabase database features:

1. **Run SQL Schema**
   - In Supabase Dashboard > SQL Editor
   - Run the schema from `my-app/supabase/schema.sql`

2. **Enable Row Level Security**
   - Ensure RLS is enabled on all tables
   - Add appropriate policies for user data access

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**
   - Make sure the redirect URI in Google Console exactly matches your Supabase URL
   - Format: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

2. **"Client ID not found"**
   - Verify Google Client ID is correctly copied
   - Make sure OAuth consent screen is published

3. **"Provider not enabled"**
   - Ensure Google provider is toggled ON in Supabase
   - Check that Client ID and Secret are saved

4. **Environment variables not loaded**
   - Restart development server after updating .env.local
   - Verify file is named `.env.local` not `.env`

## Quick Fix for Development

If you want to quickly disable Google login for development:

1. **Comment out Google login in login page**
2. **Use wallet authentication instead**
3. **Or create a demo mode without authentication**

The app is designed to work with multiple authentication methods, so Google OAuth is optional. 