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

    console.log('[CRON] Running portfolio rebalancing...');
    
    // Import portfolio manager dynamically to avoid module resolution issues
    const { portfolioManager } = await import('../../../../lib/portfolio-manager');
    
    // Get portfolios that need rebalancing
    const portfoliosToRebalance = await portfolioManager.getPortfoliosForRebalancing();
    
    const results = {
      portfoliosProcessed: 0,
      portfoliosRebalanced: 0,
      errors: [] as string[]
    };
    
    for (const portfolio of portfoliosToRebalance) {
      try {
        results.portfoliosProcessed++;
        await portfolioManager.rebalancePortfolio(portfolio.id);
        results.portfoliosRebalanced++;
        console.log(`[CRON] Rebalanced portfolio ${portfolio.id} (${portfolio.name})`);
      } catch (error: any) {
        results.errors.push(`Portfolio ${portfolio.id} rebalancing failed: ${error.message}`);
        console.error(`[CRON] Failed to rebalance portfolio ${portfolio.id}:`, error);
      }
    }
    
    return NextResponse.json({
      success: results.errors.length === 0,
      timestamp: new Date().toISOString(),
      results,
      message: `Portfolio rebalancing completed. Processed ${results.portfoliosProcessed} portfolios.`
    });
  } catch (error: any) {
    console.error('[CRON] Portfolio rebalancing failed:', error);
    return NextResponse.json(
      { 
        error: 'Portfolio rebalancing failed',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}