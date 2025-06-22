import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth-service';

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    // Validate inputs
    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token and email are required' },
        { status: 400 }
      );
    }

    // Verify the token
    const verificationResult = await authService.verifyToken(token, email);

    if (verificationResult.success) {
      // Create user session
      const sessionData = await authService.createUserSession(email);

      return NextResponse.json({
        success: true,
        userId: sessionData.userId,
        sessionToken: sessionData.sessionToken,
        redirectTo: verificationResult.redirectTo || '/convocore',
        message: 'Successfully verified magic link'
      });
    } else {
      return NextResponse.json(
        { error: verificationResult.error || 'Invalid magic link' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 