import { NextRequest } from 'next/server';

// Custom authentication service for magic links
export class AuthService {
  private static instance: AuthService;
  private pendingTokens = new Map<string, { email: string; expires: number; redirectTo?: string }>();

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Generate a secure token for magic link
  generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  // Send magic link email (simulation for now)
  async sendMagicLink(email: string, redirectTo?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = this.generateToken();
      const expires = Date.now() + (15 * 60 * 1000); // 15 minutes

      // Store the token temporarily
      this.pendingTokens.set(token, { email, expires, redirectTo });

      // In a real implementation, you would send an actual email here
      // For now, we'll log the magic link URL
      const magicLinkUrl = `https://convocore.site/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;
      
      console.log('Magic Link Generated:', magicLinkUrl);
      console.log('Email:', email);
      console.log('Token:', token);
      console.log('Expires:', new Date(expires).toISOString());

      // Simulate email sending
      await this.simulateEmailSending(email, magicLinkUrl);

      return { success: true };
    } catch (error) {
      console.error('Failed to send magic link:', error);
      return { success: false, error: 'Failed to send magic link' };
    }
  }

  // Simulate email sending (in production, use a real email service)
  private async simulateEmailSending(email: string, magicLinkUrl: string): Promise<void> {
    // In production, integrate with:
    // - SendGrid
    // - Resend
    // - AWS SES
    // - Nodemailer with SMTP
    
    console.log(`
=== MAGIC LINK EMAIL SIMULATION ===
To: ${email}
Subject: Sign in to Convocore

Click the link below to sign in to your Convocore account:
${magicLinkUrl}

This link will expire in 15 minutes.

If you didn't request this, please ignore this email.
===================================
    `);

    // For development, you could also write to a file or use a local email service
    if (typeof window !== 'undefined') {
      // Store in localStorage for development testing
      const magicLinks = JSON.parse(localStorage.getItem('dev_magic_links') || '[]');
      magicLinks.push({
        email,
        url: magicLinkUrl,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('dev_magic_links', JSON.stringify(magicLinks.slice(-10))); // Keep last 10
    }
  }

  // Verify magic link token
  async verifyToken(token: string, email: string): Promise<{ success: boolean; redirectTo?: string; error?: string }> {
    const tokenData = this.pendingTokens.get(token);

    if (!tokenData) {
      return { success: false, error: 'Invalid or expired magic link' };
    }

    if (tokenData.email !== email) {
      return { success: false, error: 'Email mismatch' };
    }

    if (Date.now() > tokenData.expires) {
      this.pendingTokens.delete(token);
      return { success: false, error: 'Magic link has expired' };
    }

    // Token is valid, clean up and return success
    this.pendingTokens.delete(token);
    
    return { 
      success: true, 
      redirectTo: tokenData.redirectTo || '/convocore' 
    };
  }

  // Create user session after successful verification
  async createUserSession(email: string): Promise<{ userId: string; sessionToken: string }> {
    // Generate a user ID based on email
    const userId = `user_${Buffer.from(email).toString('base64').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
    
    // Generate session token
    const sessionToken = this.generateToken();
    
    // In production, store this in a database with expiration
    // For now, we'll use a simple approach
    
    return { userId, sessionToken };
  }

  // Clean up expired tokens (call this periodically)
  cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, data] of this.pendingTokens.entries()) {
      if (now > data.expires) {
        this.pendingTokens.delete(token);
      }
    }
  }
}

export const authService = AuthService.getInstance();

// Helper function to get user from session
export function getUserFromSession(request: NextRequest): { userId: string; email: string } | null {
  try {
    // Check for session in cookies or headers
    const sessionToken = request.cookies.get('session_token')?.value;
    const userEmail = request.cookies.get('user_email')?.value;
    const userId = request.cookies.get('user_id')?.value;

    if (sessionToken && userEmail && userId) {
      return { userId, email: userEmail };
    }

    return null;
  } catch {
    return null;
  }
} 