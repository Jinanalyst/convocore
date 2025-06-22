import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo') ?? '/convocore';

  // Check if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables not configured');
    return NextResponse.redirect(`${origin}/auth/login?error=configuration`);
  }

  if (code) {
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: Record<string, unknown>) {
              cookieStore.set({ name, value, ...options });
            },
            remove(name: string, options: Record<string, unknown>) {
              cookieStore.set({ name, value: '', ...options });
            },
          },
        }
      );

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        console.log('Magic link authentication successful');
        return NextResponse.redirect(`${origin}${redirectTo}`);
      } else {
        console.error('Magic link authentication failed:', error.message);
        return NextResponse.redirect(`${origin}/auth/login?error=auth_failed&message=${encodeURIComponent(error.message)}`);
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${origin}/auth/login?error=callback_error`);
    }
  }

  // No code provided
  console.error('No auth code provided in callback');
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
} 