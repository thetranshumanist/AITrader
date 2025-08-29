import { NextRequest, NextResponse } from 'next/server';
import { portfolioManager } from '@/lib/portfolio-manager';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

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

    if (portfolioId) {
      // Get specific portfolio
      const portfolio = await portfolioManager.getPortfolio(portfolioId, (session.user as any).id);
      
      if (!portfolio) {
        return NextResponse.json(
          { error: 'Portfolio not found' },
          { status: 404 }
        );
      }

      // Get positions and performance
      const [positions, performance] = await Promise.all([
        portfolioManager.getPortfolioPositions(portfolioId),
        portfolioManager.calculatePerformance(portfolioId),
      ]);

      return NextResponse.json({
        data: {
          portfolio,
          positions,
          performance,
        },
        message: 'Portfolio data retrieved successfully'
      });
    } else {
      // Get all user portfolios
      const portfolios = await portfolioManager.getUserPortfolios((session.user as any).id);
      
      return NextResponse.json({
        data: { portfolios },
        message: 'Portfolios retrieved successfully'
      });
    }
  } catch (error: any) {
    console.error('Error getting portfolios:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { name, description, initialCash = 100000 } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Portfolio name is required' },
        { status: 400 }
      );
    }

    // Create new portfolio
    const portfolio = await portfolioManager.createPortfolio(
      (session.user as any).id,
      name.trim(),
      parseFloat(initialCash),
      description?.trim()
    );

    return NextResponse.json({
      data: { portfolio },
      message: 'Portfolio created successfully'
    });
  } catch (error: any) {
    console.error('Error creating portfolio:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { portfolioId, action } = body;

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Portfolio ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'updateValue':
        await portfolioManager.updatePortfolioValue(portfolioId);
        return NextResponse.json({
          message: 'Portfolio value updated successfully'
        });

      case 'sync':
        const syncResult = await portfolioManager.syncWithBrokerageAccounts(portfolioId);
        return NextResponse.json({
          data: syncResult,
          message: 'Portfolio synchronized with brokerage accounts'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error updating portfolio:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    await portfolioManager.deletePortfolio(portfolioId, (session.user as any).id);

    return NextResponse.json({
      message: 'Portfolio deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting portfolio:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}