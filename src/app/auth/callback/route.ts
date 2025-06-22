import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo') ?? '/convocore';

  // Enhanced configuration check
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration missing:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey
    });
    return NextResponse.redirect(`${origin}/auth/login?error=configuration&message=${encodeURIComponent('Authentication service is not properly configured. Please contact support.')}`);
  }

  if (code) {
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: Record<string, unknown>) {
              try {
                cookieStore.set({ name, value, ...options });
              } catch (error) {
                console.error('Failed to set cookie:', error);
              }
            },
            remove(name: string, options: Record<string, unknown>) {
              try {
                cookieStore.set({ name, value: '', ...options });
              } catch (error) {
                console.error('Failed to remove cookie:', error);
              }
            },
          },
        }
      );

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && data.session) {
        console.log('Authentication successful:', {
          userId: data.user?.id,
          email: data.user?.email,
          provider: data.user?.app_metadata?.provider
        });
        
        return NextResponse.redirect(`${origin}${redirectTo}`);
      } else {
        console.error('Authentication failed:', {
          error: error?.message,
          hasSession: !!data.session,
          hasUser: !!data.user
        });
        
        const errorMessage = error?.message || 'Authentication failed';
        return NextResponse.redirect(`${origin}/auth/login?error=auth_failed&message=${encodeURIComponent(errorMessage)}`);
      }
    } catch (error) {
      console.error('Auth callback exception:', error);
      return NextResponse.redirect(`${origin}/auth/login?error=callback_error&message=${encodeURIComponent('An unexpected error occurred during authentication')}`);
    }
  }

  // No code provided
  console.error('Auth callback called without code parameter');
  return NextResponse.redirect(`${origin}/auth/login?error=no_code&message=${encodeURIComponent('Invalid authentication link. Please try logging in again.')}`);
} 