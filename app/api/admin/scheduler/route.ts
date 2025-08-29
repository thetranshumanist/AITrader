import { NextRequest, NextResponse } from 'next/server';
import { scheduler } from '@/lib/scheduler';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET - Get scheduler status
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get job status
    const status = scheduler.getJobStatus();

    return NextResponse.json({
      data: {
        status,
        isInitialized: scheduler['isInitialized'] || false,
        timestamp: new Date().toISOString(),
      },
      message: 'Scheduler status retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error getting scheduler status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Manual trigger for scheduler jobs
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, jobId } = body;

    let result;

    switch (action) {
      case 'trigger':
        if (!jobId) {
          return NextResponse.json(
            { error: 'Job ID is required for trigger action' },
            { status: 400 }
          );
        }

        // Trigger specific job
        switch (jobId) {
          case 'dailyWorkflow':
            await scheduler.triggerDailyWorkflow();
            result = { message: 'Daily workflow triggered successfully' };
            break;
          case 'marketDataSync':
            await scheduler.triggerMarketDataSync();
            result = { message: 'Market data sync triggered successfully' };
            break;
          case 'portfolioRebalancing':
            await scheduler.triggerPortfolioRebalancing();
            result = { message: 'Portfolio rebalancing triggered successfully' };
            break;
          case 'systemHealthCheck':
            await scheduler.triggerHealthCheck();
            result = { message: 'System health check triggered successfully' };
            break;
          default:
            return NextResponse.json(
              { error: `Unknown job ID: ${jobId}` },
              { status: 400 }
            );
        }
        break;

      case 'enable':
        if (!jobId) {
          return NextResponse.json(
            { error: 'Job ID is required for enable action' },
            { status: 400 }
          );
        }
        scheduler.enableJob(jobId);
        result = { message: `Job ${jobId} enabled successfully` };
        break;

      case 'disable':
        if (!jobId) {
          return NextResponse.json(
            { error: 'Job ID is required for disable action' },
            { status: 400 }
          );
        }
        scheduler.disableJob(jobId);
        result = { message: `Job ${jobId} disabled successfully` };
        break;

      case 'initialize':
        await scheduler.initialize();
        result = { message: 'Scheduler initialized successfully' };
        break;

      case 'shutdown':
        scheduler.shutdown();
        result = { message: 'Scheduler shutdown successfully' };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      data: result,
      message: result.message
    });
  } catch (error: any) {
    console.error('Error controlling scheduler:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update job configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { jobId, schedule } = body;

    if (!jobId || !schedule) {
      return NextResponse.json(
        { error: 'Job ID and schedule are required' },
        { status: 400 }
      );
    }

    // Validate cron expression (basic validation)
    const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
    
    if (!cronRegex.test(schedule)) {
      return NextResponse.json(
        { error: 'Invalid cron expression' },
        { status: 400 }
      );
    }

    scheduler.updateJobSchedule(jobId, schedule);

    return NextResponse.json({
      data: { jobId, schedule },
      message: `Job ${jobId} schedule updated successfully`
    });
  } catch (error: any) {
    console.error('Error updating job schedule:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}