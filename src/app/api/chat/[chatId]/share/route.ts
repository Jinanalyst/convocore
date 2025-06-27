import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    
    // For now, return empty shares array since we're not using a database
    // In production, you'd fetch from your database here
    return NextResponse.json({ shares: [] });
    
  } catch (error) {
    console.error('Get shares API error:', error);
    return NextResponse.json(
      { error: 'Failed to get share links' },
      { status: 500 }
    );
  }
} 