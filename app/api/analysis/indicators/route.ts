import { NextRequest, NextResponse } from 'next/server';
import { TechnicalAnalysis, PriceData } from '@/lib/indicators';
import { supabaseAdmin } from '@/lib/supabase';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, assetType, timeframe, periods } = body;

    if (!symbol || !assetType) {
      return NextResponse.json(
        { error: 'Symbol and asset type are required' },
        { status: 400 }
      );
    }

    let priceData: PriceData[] = [];

    // Fetch price data based on asset type
    if (assetType === 'stock') {
      // Dynamic import to prevent build-time instantiation
      const { alpacaService } = await import('@/lib/alpaca');
      
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (periods || 100) * 24 * 60 * 60 * 1000);
      
      const bars = await alpacaService.getHistoricalBars(
        symbol,
        timeframe || '1Day',
        startDate,
        endDate,
        periods || 100
      );
      
      priceData = bars.map(bar => ({
        timestamp: bar.timestamp,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
      }));
    } else if (assetType === 'crypto') {
      // Dynamic import to prevent build-time instantiation
      const { geminiService } = await import('@/lib/gemini');
      
      if (!geminiService.isConfigured()) {
        return NextResponse.json(
          { error: 'Gemini API not configured for crypto analysis' },
          { status: 503 }
        );
      }

      const candles = await geminiService.getCandles(
        symbol,
        timeframe || '1day'
      );
      
      priceData = candles.map(candle => ({
        timestamp: candle.timestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      }));
    }

    // Validate data sufficiency
    const validation = TechnicalAnalysis.validateDataSufficiency(priceData);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Insufficient data for technical analysis',
          details: validation.missing,
          recommendations: validation.recommendations 
        },
        { status: 400 }
      );
    }

    // Calculate technical indicators
    const indicators = TechnicalAnalysis.generateIndicators(symbol, priceData);
    
    if (indicators.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate technical indicators' },
        { status: 500 }
      );
    }

    // Store indicators in database
    if (supabaseAdmin) {
      const indicatorData = indicators.map(indicator => ({
        symbol: indicator.symbol,
        asset_type: assetType,
        timestamp: indicator.timestamp.toISOString(),
        indicators: {
          macd: indicator.macd,
          rsi: indicator.rsi,
          stochastic: indicator.stochastic,
          bollingerBands: indicator.bollingerBands,
          sma20: indicator.sma20,
          sma50: indicator.sma50,
          ema12: indicator.ema12,
          ema26: indicator.ema26,
          vwap: indicator.vwap,
        },
      }));

      await supabaseAdmin
        .from('technical_indicators')
        .upsert(indicatorData as any, { 
          onConflict: 'symbol,asset_type,timestamp',
          ignoreDuplicates: false 
        });
    }

    // Return the latest indicators
    const latestIndicators = indicators[indicators.length - 1];
    
    return NextResponse.json({
      data: {
        symbol,
        assetType,
        timestamp: latestIndicators.timestamp,
        indicators: latestIndicators,
        validation,
        dataPoints: priceData.length,
        calculatedPeriods: indicators.length,
      },
      message: 'Technical indicators calculated successfully'
    });
  } catch (error: any) {
    console.error('Error calculating technical indicators:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate technical indicators' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const assetType = searchParams.get('assetType');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!symbol || !assetType) {
      return NextResponse.json(
        { error: 'Symbol and asset type are required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Get stored technical indicators
    const { data: indicators, error } = await supabaseAdmin
      .from('technical_indicators')
      .select('*')
      .eq('symbol', symbol)
      .eq('asset_type', assetType)
      .order('timestamp', { ascending: false })
      .limit(limit) as {
        data: any[] | null;
        error: any;
      };

    if (error) {
      throw error;
    }

    if (!indicators || indicators.length === 0) {
      return NextResponse.json(
        { 
          error: 'No technical indicators found for this symbol',
          suggestion: 'Try calculating indicators first using POST request'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        symbol,
        assetType,
        indicators: indicators.map((ind: any) => ({
          timestamp: ind.timestamp,
          indicators: ind.indicators,
        })),
        count: indicators.length,
      }
    });
  } catch (error: any) {
    console.error('Error fetching technical indicators:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch technical indicators' },
      { status: 500 }
    );
  }
}