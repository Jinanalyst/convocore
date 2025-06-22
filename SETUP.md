# Convocore Setup Guide

## Environment Configuration

To enable magic link authentication and other features, you need to set up environment variables.

### 1. Create Environment File

Create a file named `.env.local` in the root directory of the project:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Service API Keys (Optional)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 2. Supabase Setup

1. Go to [Supabase](https://app.supabase.com)
2. Create a new project or use an existing one
3. Go to **Settings** > **API**
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Authentication Configuration

In your Supabase project:

1. Go to **Authentication** > **Settings**
2. Configure **Site URL**: `http://localhost:3000` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - Your production domain callback URL

### 4. Database Setup

Run the SQL schema in your Supabase project:

```sql
-- Enable RLS
alter table auth.users enable row level security;

-- Create users table
create table public.users (
  id uuid references auth.users(id) primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  subscription_tier text default 'free',
  subscription_status text default 'active',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create RLS policies
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);
```

### 5. Features Available

- **With Supabase configured**: Magic link authentication, email/password login, Google OAuth
- **Without Supabase**: Wallet-only authentication (TRON, Ethereum, etc.)
- **AI Features**: Require OpenAI or Anthropic API keys

### 6. Troubleshooting

**Magic Link Not Working?**
- Check that environment variables are set correctly
- Verify Supabase redirect URLs are configured
- Check browser console for error messages
- Ensure email provider allows emails from Supabase

**Wallet Login Issues?**
- Ensure wallet extension is installed and unlocked
- Check browser console for connection errors
- Try refreshing the page and reconnecting

### 7. Development vs Production

**Development (.env.local):**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

**Production (Vercel/Netlify):**
Set the same environment variables in your hosting platform's environment settings.

## Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Test wallet authentication as a fallback
4. Contact support if problems persist 