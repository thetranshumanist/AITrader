import { NextRequest, NextResponse } from 'next/server';

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

    console.log('[CRON] Running daily workflow...');
    
    // Import scheduler dynamically to avoid module resolution issues
    const { scheduler } = await import('../../../../lib/scheduler');
    
    // Run daily workflow
    const result = await scheduler.triggerDailyWorkflow();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
      message: 'Daily workflow completed'
    });
  } catch (error: any) {
    console.error('[CRON] Daily workflow failed:', error);
    return NextResponse.json(
      { 
        error: 'Daily workflow failed',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}