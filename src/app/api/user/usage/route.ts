import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const cookieStore = await cookies();
      const deviceId = cookieStore.get('device_id')?.value;
      if (deviceId) {
        const localUsage = await getLocalUsage(deviceId, supabase);
        return NextResponse.json(localUsage);
      }
      return NextResponse.json({ used: 0, limit: 3 });
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('api_requests_used, api_requests_limit')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user usage:', error.message);
      return NextResponse.json({ used: 0, limit: 3 });
    }

    return NextResponse.json({ used: data.api_requests_used, limit: data.api_requests_limit });

  } catch (err) {
    console.error('API GET Usage Error:', err);
    return NextResponse.json({ used: 0, limit: 3 }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const cookieStore = await cookies();
      const deviceId = cookieStore.get('device_id')?.value;
      if (deviceId) {
        await incrementLocalUsage(deviceId, supabase);
      }
      return NextResponse.json({ ok: true });
    }

    const { error } = await supabase.rpc('increment_api_usage', { user_id: user.id });

    if (error) {
      console.error('Error incrementing usage:', error.message);
      return NextResponse.json({ ok: false, error: 'Failed to increment usage' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('API POST Usage Error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// Helper functions for local device usage tracking
async function getLocalUsage(deviceId: string, supabase: any) {
  // This is a simplified example. In a real app, you'd store this in a separate table.
  // For now, we simulate it. This part needs a proper table for anonymous user usage.
  console.warn(`Local usage tracking not fully implemented for device: ${deviceId}`);
  return { used: 0, limit: 3 };
}

async function incrementLocalUsage(deviceId: string, supabase: any) {
  // This is a simplified example. In a real app, you'd store this in a separate table.
  console.warn(`Local usage increment not fully implemented for device: ${deviceId}`);
} 