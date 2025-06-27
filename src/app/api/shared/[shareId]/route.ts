import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;

    if (!shareId) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 });
    }

    // For now, return an error since we're not using a database for shared chats
    // In production, you'd implement proper shared chat functionality
    return NextResponse.json(
      { error: 'Shared chat functionality is not yet implemented' },
      { status: 501 }
    );

  } catch (error) {
    console.error('Shared chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to load shared chat. Please check if the chat exists and is properly shared.' },
      { status: 500 }
    );
  }
} 