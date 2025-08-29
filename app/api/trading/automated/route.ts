import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
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
    const { portfolioId } = body;

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Portfolio ID is required' },
        { status: 400 }
      );
    }

    // Dynamic import to prevent build-time instantiation
    const { tradingEngine } = await import('@/lib/trading-engine');

    // Process automated trading
    const result = await tradingEngine.processAutomatedTrading(
      (session.user as any).id,
      portfolioId
    );

    return NextResponse.json({
      data: result,
      message: `Automated trading completed. ${result.executed} trades executed, ${result.failed} failed.`
    });
  } catch (error: any) {
    console.error('Automated trading error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check automated trading status
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

    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Portfolio ID is required' },
        { status: 400 }
      );
    }

    // Dynamic import to prevent build-time instantiation
    const { tradingEngine } = await import('@/lib/trading-engine');

    // Get recent trading activity summary
    const metrics = await tradingEngine.getPortfolioMetrics(
      (session.user as any).id,
      portfolioId
    );

    return NextResponse.json({
      data: {
        portfolioMetrics: metrics,
        automatedTradingEnabled: true,
        lastProcessed: new Date().toISOString(),
        status: 'active',
      },
      message: 'Automated trading status retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error getting automated trading status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}