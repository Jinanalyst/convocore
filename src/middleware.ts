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

  // Skip middleware if Supabase is not configured (development mode)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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

  // Ensure guests have a device_id cookie so we can track usage server-side
  if (!user) {
    const existingDeviceId = request.cookies.get('device_id')?.value;
    if (!existingDeviceId) {
      const newId = crypto.randomUUID();
      response.cookies.set({
        name: 'device_id',
        value: newId,
        httpOnly: false,
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }
  }

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