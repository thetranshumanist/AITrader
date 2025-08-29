import { NextRequest, NextResponse } from 'next/server';
import { SignalGenerator, TradingSignal } from '@/lib/signals';
import { TechnicalAnalysis, PriceData } from '@/lib/indicators';
import { supabaseAdmin } from '@/lib/supabase';
import { alpacaService } from '@/lib/alpaca';
import { geminiService } from '@/lib/gemini';

const signalGenerator = new SignalGenerator();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      symbol,
      assetType,
      portfolioValue = 100000,
      customWeights,
      customRisk,
      timeframe = '1Day'
    } = body;

    if (!symbol || !assetType) {
      return NextResponse.json(
        { error: 'Symbol and asset type are required' },
        { status: 400 }
      );
    }

    // Fetch price data based on asset type
    let priceData: PriceData[] = [];
    let currentPrice = 0;

    if (assetType === 'stock') {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 100 * 24 * 60 * 60 * 1000);
      
      const bars = await alpacaService.getHistoricalBars(
        symbol,
        timeframe,
        startDate,
        endDate,
        100
      );
      
      priceData = bars.map(bar => ({
        timestamp: bar.timestamp,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
      }));

      // Get current price
      const quote = await alpacaService.getLatestQuote(symbol);
      currentPrice = (quote.bidPrice + quote.askPrice) / 2;
    } else if (assetType === 'crypto') {
      if (!geminiService.isConfigured()) {
        return NextResponse.json(
          { error: 'Gemini API not configured for crypto signals' },
          { status: 503 }
        );
      }

      const candles = await geminiService.getCandles(symbol, '1day');
      
      priceData = candles.map(candle => ({
        timestamp: candle.timestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      }));

      // Get current price
      const ticker = await geminiService.getTicker(symbol);
      currentPrice = ticker.price;
    }

    if (priceData.length < 50) {
      return NextResponse.json(
        { error: 'Insufficient price data for signal generation (minimum 50 periods)' },
        { status: 400 }
      );
    }

    // Calculate technical indicators
    const indicators = TechnicalAnalysis.getLatestIndicators(symbol, priceData);
    
    if (!indicators) {
      return NextResponse.json(
        { error: 'Failed to calculate technical indicators' },
        { status: 500 }
      );
    }

    // Generate trading signal
    const signal = signalGenerator.generateSignal(
      symbol,
      assetType,
      indicators,
      priceData,
      currentPrice,
      portfolioValue,
      customWeights,
      customRisk
    );

    // Validate signal quality
    const validation = signalGenerator.validateSignal(signal);

    // Store signal in database
    if (supabaseAdmin) {
      const signalData = {
        symbol: signal.symbol,
        asset_type: signal.assetType,
        action: signal.action,
        confidence: signal.confidence,
        reasoning: signal.reasoning,
        indicators: {
          macd: signal.indicators.macd,
          rsi: signal.indicators.rsi,
          stochastic: signal.indicators.stochastic,
          bollingerBands: signal.indicators.bollingerBands,
          sma20: signal.indicators.sma20,
          sma50: signal.indicators.sma50,
          ema12: signal.indicators.ema12,
          ema26: signal.indicators.ema26,
          vwap: signal.indicators.vwap,
        },
        timestamp: signal.timestamp.toISOString(),
        target_price: signal.targetPrice,
        stop_loss: signal.stopLoss,
        take_profit: signal.takeProfit,
      };

      await supabaseAdmin
        .from('trading_signals')
        .insert(signalData as any);
    }

    return NextResponse.json({
      data: {
        signal,
        validation,
        metadata: {
          dataPoints: priceData.length,
          currentPrice,
          strategiesAnalyzed: signal.strategies.length,
          signalStrength: signal.confidence > 0.7 ? 'Strong' : signal.confidence > 0.5 ? 'Moderate' : 'Weak',
        }
      },
      message: 'Trading signal generated successfully'
    });
  } catch (error: any) {
    console.error('Error generating trading signal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate trading signal' },
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
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0');
    const action = searchParams.get('action') as 'buy' | 'sell' | 'hold' | null;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Build query
    let query = supabaseAdmin
      .from('trading_signals')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (symbol) {
      query = query.eq('symbol', symbol);
    }

    if (assetType) {
      query = query.eq('asset_type', assetType);
    }

    if (minConfidence > 0) {
      query = query.gte('confidence', minConfidence);
    }

    if (action && action !== 'hold') {
      query = query.eq('action', action);
    }

    const { data: signals, error } = await query as {
      data: any[] | null;
      error: any;
    };

    if (error) {
      throw error;
    }

    // Get summary statistics
    const stats = {
      total: signals?.length || 0,
      buySignals: signals?.filter((s: any) => s.action === 'buy').length || 0,
      sellSignals: signals?.filter((s: any) => s.action === 'sell').length || 0,
      holdSignals: signals?.filter((s: any) => s.action === 'hold').length || 0,
      avgConfidence: signals?.length ? 
        signals.reduce((sum: number, s: any) => sum + s.confidence, 0) / signals.length : 0,
      highConfidenceSignals: signals?.filter((s: any) => s.confidence > 0.7).length || 0,
    };

    return NextResponse.json({
      data: {
        signals: signals || [],
        stats,
        filters: {
          symbol,
          assetType,
          minConfidence,
          action,
          limit,
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching trading signals:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trading signals' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const signalId = searchParams.get('signalId');
    const olderThanDays = parseInt(searchParams.get('olderThanDays') || '0');

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    if (signalId) {
      // Delete specific signal
      const { error } = await supabaseAdmin
        .from('trading_signals')
        .delete()
        .eq('id', signalId);

      if (error) throw error;

      return NextResponse.json({
        message: 'Signal deleted successfully'
      });
    } else if (olderThanDays > 0) {
      // Delete old signals
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { error } = await supabaseAdmin
        .from('trading_signals')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      if (error) throw error;

      return NextResponse.json({
        message: `Signals older than ${olderThanDays} days deleted successfully`
      });
    } else {
      return NextResponse.json(
        { error: 'Signal ID or olderThanDays parameter required' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error deleting trading signals:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete trading signals' },
      { status: 500 }
    );
  }
}