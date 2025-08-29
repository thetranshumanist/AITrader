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

    // Get positions
    const positions = await portfolioManager.getPortfolioPositions(portfolioId);

    // Calculate summary metrics
    const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
    const totalUnrealizedPercent = totalValue > 0 ? (totalUnrealizedPnL / totalValue) * 100 : 0;

    const positionsByType = positions.reduce((acc, pos) => {
      if (!acc[pos.assetType]) {
        acc[pos.assetType] = [];
      }
      acc[pos.assetType].push(pos);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      data: {
        positions,
        summary: {
          totalPositions: positions.length,
          totalValue,
          totalUnrealizedPnL,
          totalUnrealizedPercent,
          positionsByType,
          topPerformers: positions
            .sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent)
            .slice(0, 5),
          bottomPerformers: positions
            .sort((a, b) => a.unrealizedPnLPercent - b.unrealizedPnLPercent)
            .slice(0, 5),
        },
      },
      message: 'Positions retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error getting positions:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}