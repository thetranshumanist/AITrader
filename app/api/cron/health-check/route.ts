import { NextRequest, NextResponse } from 'next/server';
import { monitorSystemHealth } from '../../../../lib/monitoring';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Running health check...');
    
    // Perform system health checks
    const healthStatus = await monitorSystemHealth();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      health: healthStatus,
      message: 'Health check completed'
    });
  } catch (error: any) {
    console.error('[CRON] Health check failed:', error);
    return NextResponse.json(
      { 
        error: 'Health check failed',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}