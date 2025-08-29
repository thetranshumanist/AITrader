import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols')?.split(',') || [];
    
    if (symbols.length === 0) {
      return NextResponse.json(
        { error: 'Symbols parameter is required' },
        { status: 400 }
      );
    }

    // Dynamic import to prevent build-time instantiation
    const { alpacaService } = await import('@/lib/alpaca');

    // Get latest quotes for symbols
    const quotes = await alpacaService.getLatestQuotes(symbols);
    
    // Store in database for historical tracking
    if (supabaseAdmin) {
      const stockData = quotes.map(quote => ({
        symbol: quote.symbol,
        price: (quote.bidPrice + quote.askPrice) / 2, // Mid price
        volume: quote.bidSize + quote.askSize,
        timestamp: quote.timestamp.toISOString(),
        open: (quote.bidPrice + quote.askPrice) / 2,
        high: (quote.bidPrice + quote.askPrice) / 2,
        low: (quote.bidPrice + quote.askPrice) / 2,
        close: (quote.bidPrice + quote.askPrice) / 2,
        change: 0, // Will be calculated with historical data
        change_percent: 0,
      }));

      await supabaseAdmin
        .from('stock_data')
        .insert(stockData as any);
    }

    return NextResponse.json({ data: quotes });
  } catch (error: any) {
    console.error('Error fetching stock quotes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, timeframe, start, end, limit } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();

    // Dynamic import to prevent build-time instantiation
    const { alpacaService } = await import('@/lib/alpaca');

    // Get historical bars
    const bars = await alpacaService.getHistoricalBars(
      symbol,
      timeframe || '1Day',
      startDate,
      endDate,
      limit || 100
    );

    // Store in database
    if (supabaseAdmin && bars.length > 0) {
      const stockData = bars.map(bar => ({
        symbol: bar.symbol,
        price: bar.close,
        volume: bar.volume,
        timestamp: bar.timestamp.toISOString(),
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        change: bar.close - bar.open,
        change_percent: ((bar.close - bar.open) / bar.open) * 100,
      }));

      await supabaseAdmin
        .from('stock_data')
        .upsert(stockData as any, { 
          onConflict: 'symbol,timestamp',
          ignoreDuplicates: true 
        });
    }

    return NextResponse.json({ data: bars });
  } catch (error: any) {
    console.error('Error fetching historical data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}