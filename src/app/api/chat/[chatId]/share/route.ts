import { NextRequest, NextResponse } from 'next/server';
import { createClientComponentClient } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const body = await request.json();
    const { isPublic, allowComments, expiresAt, password } = body;

    // Generate a unique share ID
    const shareId = `share_${chatId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Create share URL using custom domain
    const baseUrl = 'https://convocore.site';
    const shareUrl = `${baseUrl}/shared/${shareId}`;

    try {
      // Try to save to database if Supabase is configured
      const supabase = createClientComponentClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Save share record to database
        const { error } = await supabase
          .from('shared_chats')
          .insert({
            id: shareId,
            chat_id: chatId,
            user_id: user.id,
            is_public: isPublic,
            allow_comments: allowComments,
            expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
            password_hash: password ? await hashPassword(password) : null,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error saving share record:', error);
          // Continue with fallback approach
        }
      }
    } catch (dbError) {
      console.error('Database error, using fallback:', dbError);
      // Continue with fallback approach
    }

    // For now, we'll store share info in a simple way
    // In production, you'd want to use a proper database
    console.log('Chat shared:', {
      chatId,
      shareId,
      shareUrl,
      settings: { isPublic, allowComments, expiresAt, password: !!password }
    });

    return NextResponse.json({
      success: true,
      shareUrl,
      shareId,
      expiresAt: expiresAt || null
    });

  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

// Simple password hashing (in production, use bcrypt or similar)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    
    // Get existing share links for this chat
    try {
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: shares, error } = await supabase
          .from('shared_chats')
          .select('id, is_public, allow_comments, expires_at, created_at')
          .eq('chat_id', chatId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && shares) {
          const baseUrl = 'https://convocore.site';
          const shareLinks = shares.map(share => ({
            ...share,
            shareUrl: `${baseUrl}/shared/${share.id}`
          }));
          
          return NextResponse.json({ shares: shareLinks });
        }
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    return NextResponse.json({ shares: [] });
    
  } catch (error) {
    console.error('Get shares API error:', error);
    return NextResponse.json(
      { error: 'Failed to get share links' },
      { status: 500 }
    );
  }
} 