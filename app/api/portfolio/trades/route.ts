import { NextRequest, NextResponse } from 'next/server';
import { portfolioManager } from '@/lib/portfolio-manager';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Portfolio ID is required' },
        { status: 400 }
      );
    }

    // Verify portfolio ownership
    const portfolio = await portfolioManager.getPortfolio(portfolioId, (session.user as any).id);
    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found or access denied' },
        { status: 404 }
      );
    }

    // Get trade history with pagination
    const { trades, total } = await portfolioManager.getTradeHistory(
      portfolioId,
      limit,
      offset
    );

    // Calculate trade statistics
    const tradeStats = {
      totalTrades: total,
      totalVolume: trades.reduce((sum, trade) => sum + (trade.quantity * trade.price), 0),
      totalFees: trades.reduce((sum, trade) => sum + trade.fees, 0),
      totalRealizedPnL: trades.reduce((sum, trade) => sum + (trade.realizedPnL || 0), 0),
      winningTrades: trades.filter(trade => (trade.realizedPnL || 0) > 0).length,
      losingTrades: trades.filter(trade => (trade.realizedPnL || 0) < 0).length,
      breakEvenTrades: trades.filter(trade => (trade.realizedPnL || 0) === 0).length,
    };

    const winRate = tradeStats.totalTrades > 0 
      ? (tradeStats.winningTrades / tradeStats.totalTrades) * 100 
      : 0;

    // Group trades by date for chart data
    const tradesByDate = trades.reduce((acc, trade) => {
      const date = trade.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          trades: 0,
          volume: 0,
          pnl: 0,
        };
      }
      acc[date].trades += 1;
      acc[date].volume += trade.quantity * trade.price;
      acc[date].pnl += trade.realizedPnL || 0;
      return acc;
    }, {} as Record<string, any>);

    const chartData = Object.values(tradesByDate).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({
      data: {
        trades,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
        statistics: {
          ...tradeStats,
          winRate,
          avgTradeValue: tradeStats.totalTrades > 0 
            ? tradeStats.totalVolume / tradeStats.totalTrades 
            : 0,
          avgRealizedPnL: tradeStats.totalTrades > 0 
            ? tradeStats.totalRealizedPnL / tradeStats.totalTrades 
            : 0,
        },
        chartData,
      },
      message: 'Trade history retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error getting trade history:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}