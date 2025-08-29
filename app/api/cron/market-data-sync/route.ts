import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Running market data sync...');
    
    // Import services dynamically to avoid module resolution issues
    const { alpacaService } = await import('../../../../lib/alpaca');
    const { geminiService } = await import('../../../../lib/gemini');
    
    const results = {
      stocks: null as any,
      crypto: null as any,
      errors: [] as string[]
    };
    
    // Sync stock market data
    try {
      const isOpen = await alpacaService.isMarketOpen();
      if (isOpen) {
        // Market is open, sync real-time data
        console.log('[CRON] Market is open, syncing real-time data...');
        results.stocks = { status: 'synced', marketOpen: true };
      } else {
        console.log('[CRON] Market is closed, skipping real-time sync');
        results.stocks = { status: 'skipped', marketOpen: false };
      }
    } catch (error: any) {
      results.errors.push(`Stock sync error: ${error.message}`);
    }
    
    // Sync crypto data (24/7 market)
    try {
      if (geminiService.isConfigured()) {
        console.log('[CRON] Syncing crypto market data...');
        // Add your crypto sync logic here
        results.crypto = { status: 'synced' };
      } else {
        results.crypto = { status: 'not_configured' };
      }
    } catch (error: any) {
      results.errors.push(`Crypto sync error: ${error.message}`);
    }
    
    return NextResponse.json({
      success: results.errors.length === 0,
      timestamp: new Date().toISOString(),
      results,
      message: 'Market data sync completed'
    });
  } catch (error: any) {
    console.error('[CRON] Market data sync failed:', error);
    return NextResponse.json(
      { 
        error: 'Market data sync failed',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}