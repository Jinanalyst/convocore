# Google Authentication Setup Guide

This guide will help you set up Google OAuth authentication for Convocore using Supabase.

## Prerequisites

1. Supabase project
2. Google Cloud Console project
3. Domain name (for production)

## Step 1: Set up Google OAuth in Google Cloud Console

### 1.1 Create Google Cloud Project (if you don't have one)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API

### 1.2 Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - **App name**: Convocore
   - **User support email**: your email
   - **Developer contact information**: your email
4. Add **Authorized domains**: `convocore.site` (or your domain)
5. Add **Scopes**: `email`, `profile`, `openid`

### 1.3 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Set **Authorized JavaScript origins**:
   - `http://localhost:3000` (for development)
   - `https://convocore.site` (for production)
5. Set **Authorized redirect URIs**:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://convocore.site/auth/callback` (for production)
   - `https://your-supabase-project.supabase.co/auth/v1/callback` (Supabase callback)
6. Save and note the **Client ID** and **Client Secret**

## Step 2: Configure Supabase

### 2.1 Enable Google Auth Provider
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and click **Configure**
4. Enable the Google provider
5. Enter your Google **Client ID** and **Client Secret**
6. Set the **Redirect URL** to: `https://your-supabase-project.supabase.co/auth/v1/callback`

### 2.2 Configure RLS Policies (Optional)
If you're using Row Level Security, make sure to set up proper policies for the `users` table.

## Step 3: Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google OAuth (Optional - already configured in Supabase)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Database Schema

Make sure you have a `users` table in your Supabase database:

```sql
-- Create users table
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  subscription_tier text default 'free',
  subscription_status text default 'active',
  api_requests_used integer default 0,
  api_requests_limit integer default 10,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_login timestamp with time zone
);

-- Set up RLS (Row Level Security)
alter table public.users enable row level security;

-- Create policies
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Create trigger to automatically create user profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url, last_login)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Step 5: Testing

### 5.1 Development Testing
1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/auth/login`
3. Click "Continue with Google"
4. Complete the OAuth flow
5. Check if you're redirected back to your app

### 5.2 Production Testing
1. Deploy your app to your production domain
2. Update the Google OAuth settings with your production URLs
3. Test the complete flow

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Make sure your redirect URIs in Google Console match exactly
   - Include both your app URL and Supabase callback URL

2. **"origin_mismatch" error**
   - Check that your JavaScript origins are correctly set in Google Console

3. **"invalid_client" error**
   - Verify your Client ID and Client Secret are correct in Supabase

4. **User not created in database**
   - Check that the database trigger is working
   - Verify your RLS policies allow user creation

### Debug Steps

1. Check browser console for errors
2. Check Supabase logs in the dashboard
3. Verify environment variables are loaded correctly
4. Test with a fresh incognito browser session

## Security Considerations

1. **Never expose Client Secret** - Only use it in Supabase configuration
2. **Use HTTPS in production** - Google OAuth requires secure connections
3. **Validate redirect URIs** - Only allow trusted domains
4. **Set up proper CORS** - Configure allowed origins correctly

## Additional Features

### User Profile Management
The app includes a profile modal that shows:
- User name and email
- Subscription tier
- API usage statistics
- Account creation date

### Wallet Integration
Users can also connect using crypto wallets:
- TronLink (for USDT payments)
- MetaMask
- Other popular wallets

## Support

If you encounter issues:
1. Check the Supabase documentation
2. Review Google OAuth documentation
3. Check the GitHub issues for known problems
4. Contact support at support@convocore.site 