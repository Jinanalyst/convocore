import { NextResponse } from 'next/server';
import { validateAPIKeys } from '@/lib/ai-service';

export async function GET() {
  try {
    const apiKeyStatus = await validateAPIKeys();
    
    return NextResponse.json({
      success: true,
      data: {
        apiKeys: apiKeyStatus,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Status API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 