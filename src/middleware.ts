import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // CORS for assistant API
  if (request.nextUrl.pathname.startsWith('/api/assistant')) {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      const res = new NextResponse(null, { status: 204 });
      res.headers.set('Access-Control-Allow-Origin', '*');
      res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      return res;
    }
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }

  const supabaseUrlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are missing OR URL is obviously invalid, skip Supabase auth logic.
  const urlIsValid = !!supabaseUrlEnv && /^https?:\/\//.test(supabaseUrlEnv);

  if (!urlIsValid || !supabaseAnonEnv) {
    // Log once for debugging in dev (won't run at edge runtime for prod)
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Supabase middleware disabled: invalid or missing NEXT_PUBLIC_SUPABASE_URL');
    }
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Get user session
  const { data: { user }, error } = await supabase.auth.getUser();

  // Check for wallet authentication in cookies
  const walletConnected = request.cookies.get('wallet_connected')?.value === 'true';
  const walletAddress = request.cookies.get('wallet_address')?.value;

  // Protected routes that require authentication
  const protectedRoutes = ['/convocore', '/dashboard'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without authentication
  // Allow either Supabase user OR wallet authentication
  if (isProtectedRoute && !user && !walletConnected) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  const authRoutes = ['/auth/login', '/auth/signup'];
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isAuthRoute && (user || walletConnected)) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/convocore';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 