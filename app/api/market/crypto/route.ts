import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const { geminiService } = await import('@/lib/gemini');

    if (!geminiService.isConfigured()) {
      return NextResponse.json(
        { error: 'Gemini API not configured' },
        { status: 503 }
      );
    }

    // Get ticker data for symbols
    const tickers = await geminiService.getTickers(symbols);
    
    // Store in database for historical tracking
    if (supabaseAdmin && tickers.length > 0) {
      const cryptoData = tickers.map(ticker => ({
        symbol: ticker.symbol,
        price: ticker.price,
        volume: ticker.volume,
        timestamp: ticker.timestamp.toISOString(),
        high_24h: ticker.high24h,
        low_24h: ticker.low24h,
        change_24h: ticker.change24h,
        change_percent_24h: ticker.changePercent24h,
      }));

      await supabaseAdmin
        .from('crypto_data')
        .insert(cryptoData as any);
    }

    return NextResponse.json({ data: tickers });
  } catch (error: any) {
    console.error('Error fetching crypto data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch crypto data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, timeFrame, limit } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Dynamic import to prevent build-time instantiation
    const { geminiService } = await import('@/lib/gemini');

    if (!geminiService.isConfigured()) {
      return NextResponse.json(
        { error: 'Gemini API not configured' },
        { status: 503 }
      );
    }

    // Get historical candle data
    const candles = await geminiService.getCandles(
      symbol,
      timeFrame || '1day'
    );

    // Store in database
    if (supabaseAdmin && candles.length > 0) {
      const cryptoData = candles.map(candle => ({
        symbol: candle.symbol,
        price: candle.close,
        volume: candle.volume,
        timestamp: candle.timestamp.toISOString(),
        high_24h: candle.high,
        low_24h: candle.low,
        change_24h: candle.close - candle.open,
        change_percent_24h: ((candle.close - candle.open) / candle.open) * 100,
      }));

      await supabaseAdmin
        .from('crypto_data')
        .upsert(cryptoData as any, { 
          onConflict: 'symbol,timestamp',
          ignoreDuplicates: true 
        });
    }

    return NextResponse.json({ data: candles });
  } catch (error: any) {
    console.error('Error fetching crypto historical data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch crypto historical data' },
      { status: 500 }
    );
  }
}