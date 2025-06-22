import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from headers or session
    const userId = request.headers.get('x-user-id') || 'demo-user';
    
    // In a real app, this would fetch from database
    // For now, return demo data that matches the frontend
    const usage = {
      aiRequests: 1247,
      apiCalls: 523,
      tokensUsed: 45230,
      storageUsed: 2.4,
      monthlyLimit: {
        aiRequests: 'unlimited' as const,
        apiCalls: 'unlimited' as const,
        tokensUsed: 100000,
        storageUsed: 10
      }
    };

    return NextResponse.json({ usage });
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, increment = 1 } = await request.json();
    const userId = request.headers.get('x-user-id') || 'demo-user';
    
    // Validate type
    if (!['aiRequests', 'apiCalls', 'tokensUsed'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid usage type' },
        { status: 400 }
      );
    }

    // In a real app, this would update the database
    // For now, just return success
    console.log(`Updated ${type} for user ${userId} by ${increment}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating usage:', error);
    return NextResponse.json(
      { error: 'Failed to update usage' },
      { status: 500 }
    );
  }
} 