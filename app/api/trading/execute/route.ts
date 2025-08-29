import { NextRequest, NextResponse } from 'next/server';
import { tradingEngine, TradeParams } from '@/lib/trading-engine';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

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
    const {
      symbol,
      assetType,
      action,
      quantity,
      price,
      orderType = 'market',
      stopLoss,
      takeProfit,
      portfolioId,
      signalId,
    } = body;

    // Validate required fields
    if (!symbol || !assetType || !action || !quantity || !portfolioId) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: symbol, assetType, action, quantity, portfolioId' 
        },
        { status: 400 }
      );
    }

    // Create trade parameters
    const tradeParams: TradeParams = {
      symbol,
      assetType,
      action,
      quantity: parseFloat(quantity),
      price: price ? parseFloat(price) : undefined,
      orderType,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      userId: (session.user as any).id,
      portfolioId,
      signalId,
    };

    // Execute the trade
    const result = await tradingEngine.executeTrade(tradeParams);

    if (result.success) {
      return NextResponse.json({
        data: {
          orderId: result.orderId,
          executedPrice: result.executedPrice,
          executedQuantity: result.executedQuantity,
          fees: result.fees,
          timestamp: result.timestamp,
        },
        message: 'Trade executed successfully'
      });
    } else {
      return NextResponse.json(
        { 
          error: result.error || 'Trade execution failed',
          timestamp: result.timestamp,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Trade execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Portfolio ID is required' },
        { status: 400 }
      );
    }

    // Get portfolio metrics
    const metrics = await tradingEngine.getPortfolioMetrics(
      (session.user as any).id,
      portfolioId
    );

    return NextResponse.json({
      data: metrics,
      message: 'Portfolio metrics retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error getting portfolio metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}