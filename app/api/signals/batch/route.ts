import { NextRequest, NextResponse } from 'next/server';
import { SignalGenerator, TradingSignal } from '@/lib/signals';
import { TechnicalAnalysis, PriceData } from '@/lib/indicators';
import { supabaseAdmin } from '@/lib/supabase';
import { alpacaService } from '@/lib/alpaca';
import { geminiService } from '@/lib/gemini';

// Type definitions
interface ProcessResult {
  signal: TradingSignal;
  metadata: {
    dataPoints: number;
    currentPrice: number;
    strategiesAnalyzed: number;
    signalStrength: string;
  };
  validation?: {
    valid: boolean;
    issues: string[];
    recommendations: string[];
  };
}

interface FailedResult {
  symbol: string;
  assetType: 'stock' | 'crypto';
  error: string;
}

interface BatchResults {
  successful: ProcessResult[];
  failed: FailedResult[];
  summary: {
    total: number;
    buySignals: number;
    sellSignals: number;
    holdSignals: number;
    highConfidenceSignals: number;
    avgConfidence: number;
  };
}

interface SignalSummary {
  last24Hours: {
    total: number;
    buySignals: number;
    sellSignals: number;
    holdSignals: number;
    highConfidenceSignals: number;
    avgConfidence: number;
  };
  allTime?: {
    total: number;
    buySignals: number;
    sellSignals: number;
    holdSignals: number;
    avgConfidence: number;
  };
}

const signalGenerator = new SignalGenerator();

// Default watchlist symbols
const DEFAULT_STOCK_SYMBOLS = [
  'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN',
  'NVDA', 'META', 'NFLX', 'AMD', 'BABA'
];

const DEFAULT_CRYPTO_SYMBOLS = [
  'BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'DOTUSD'
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      symbols,
      portfolioValue = 100000,
      customWeights,
      customRisk,
      includeValidation = true,
      timeframe = '1Day'
    } = body;

    // Use provided symbols or default watchlist
    const stockSymbols = symbols?.stocks || DEFAULT_STOCK_SYMBOLS;
    const cryptoSymbols = symbols?.crypto || DEFAULT_CRYPTO_SYMBOLS;

    const results: BatchResults = {
      successful: [],
      failed: [],
      summary: {
        total: 0,
        buySignals: 0,
        sellSignals: 0,
        holdSignals: 0,
        highConfidenceSignals: 0,
        avgConfidence: 0,
      }
    };

    // Process stock symbols
    for (const symbol of stockSymbols) {
      try {
        const result = await processSymbol(
          symbol,
          'stock',
          portfolioValue,
          customWeights,
          customRisk,
          timeframe
        );

        if (includeValidation) {
          result.validation = signalGenerator.validateSignal(result.signal);
        }

        results.successful.push(result);
        updateSummary(results.summary, result.signal);
      } catch (error: any) {
        console.error(`Error processing stock ${symbol}:`, error);
        results.failed.push({
          symbol,
          assetType: 'stock',
          error: error.message
        });
      }
    }

    // Process crypto symbols (only if Gemini is configured)
    if (geminiService.isConfigured()) {
      for (const symbol of cryptoSymbols) {
        try {
          const result = await processSymbol(
            symbol,
            'crypto',
            portfolioValue,
            customWeights,
            customRisk,
            timeframe
          );

          if (includeValidation) {
            result.validation = signalGenerator.validateSignal(result.signal);
          }

          results.successful.push(result);
          updateSummary(results.summary, result.signal);
        } catch (error: any) {
          console.error(`Error processing crypto ${symbol}:`, error);
          results.failed.push({
            symbol,
            assetType: 'crypto',
            error: error.message
          });
        }
      }
    } else {
      console.warn('Gemini API not configured, skipping crypto signals');
    }

    // Calculate final averages
    if (results.successful.length > 0) {
      results.summary.avgConfidence = 
        results.successful.reduce((sum, r) => sum + r.signal.confidence, 0) / 
        results.successful.length;
    }

    results.summary.total = results.successful.length;

    // Store successful signals in database
    if (supabaseAdmin && results.successful.length > 0) {
      const signalData = results.successful.map(result => ({
        symbol: result.signal.symbol,
        asset_type: result.signal.assetType,
        action: result.signal.action,
        confidence: result.signal.confidence,
        reasoning: result.signal.reasoning,
        indicators: {
          macd: result.signal.indicators.macd,
          rsi: result.signal.indicators.rsi,
          stochastic: result.signal.indicators.stochastic,
          bollingerBands: result.signal.indicators.bollingerBands,
          sma20: result.signal.indicators.sma20,
          sma50: result.signal.indicators.sma50,
          ema12: result.signal.indicators.ema12,
          ema26: result.signal.indicators.ema26,
          vwap: result.signal.indicators.vwap,
        },
        timestamp: result.signal.timestamp.toISOString(),
        target_price: result.signal.targetPrice,
        stop_loss: result.signal.stopLoss,
        take_profit: result.signal.takeProfit,
      }));

      await supabaseAdmin
        .from('trading_signals')
        .insert(signalData as any);
    }

    return NextResponse.json({
      data: results,
      message: `Batch signal generation completed. ${results.successful.length} successful, ${results.failed.length} failed.`
    });
  } catch (error: any) {
    console.error('Error in batch signal generation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate batch signals' },
      { status: 500 }
    );
  }
}

async function processSymbol(
  symbol: string,
  assetType: 'stock' | 'crypto',
  portfolioValue: number,
  customWeights: any,
  customRisk: any,
  timeframe: string
): Promise<ProcessResult> {
  let priceData: PriceData[] = [];
  let currentPrice = 0;

  if (assetType === 'stock') {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 100 * 24 * 60 * 60 * 1000);
    
    const bars = await alpacaService.getHistoricalBars(
      symbol,
      timeframe as any,
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
    throw new Error(`Insufficient data for ${symbol} (${priceData.length} periods)`);
  }

  // Calculate technical indicators
  const indicators = TechnicalAnalysis.getLatestIndicators(symbol, priceData);
  
  if (!indicators) {
    throw new Error(`Failed to calculate indicators for ${symbol}`);
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

  return {
    signal,
    metadata: {
      dataPoints: priceData.length,
      currentPrice,
      strategiesAnalyzed: signal.strategies.length,
      signalStrength: signal.confidence > 0.7 ? 'Strong' : 
                     signal.confidence > 0.5 ? 'Moderate' : 'Weak',
    }
  };
}

function updateSummary(summary: BatchResults['summary'], signal: TradingSignal): void {
  switch (signal.action) {
    case 'buy':
      summary.buySignals++;
      break;
    case 'sell':
      summary.sellSignals++;
      break;
    case 'hold':
      summary.holdSignals++;
      break;
  }

  if (signal.confidence > 0.7) {
    summary.highConfidenceSignals++;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Get recent batch results summary
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: recentSignals, error } = await supabaseAdmin
      .from('trading_signals')
      .select('*')
      .gte('timestamp', twentyFourHoursAgo.toISOString())
      .order('timestamp', { ascending: false }) as {
        data: any[] | null;
        error: any;
      };

    if (error) throw error;

    const summary: SignalSummary = {
      last24Hours: {
        total: recentSignals?.length || 0,
        buySignals: recentSignals?.filter((s: any) => s.action === 'buy').length || 0,
        sellSignals: recentSignals?.filter((s: any) => s.action === 'sell').length || 0,
        holdSignals: recentSignals?.filter((s: any) => s.action === 'hold').length || 0,
        highConfidenceSignals: recentSignals?.filter((s: any) => s.confidence > 0.7).length || 0,
        avgConfidence: recentSignals?.length ? 
          recentSignals.reduce((sum: number, s: any) => sum + s.confidence, 0) / recentSignals.length : 0,
      }
    };

    if (includeStats) {
      // Get additional statistics
      const { data: allTimeSignals } = await supabaseAdmin
        .from('trading_signals')
        .select('action, confidence, timestamp')
        .order('timestamp', { ascending: false })
        .limit(1000) as { data: any[] | null };

      summary.allTime = {
        total: allTimeSignals?.length || 0,
        buySignals: allTimeSignals?.filter((s: any) => s.action === 'buy').length || 0,
        sellSignals: allTimeSignals?.filter((s: any) => s.action === 'sell').length || 0,
        holdSignals: allTimeSignals?.filter((s: any) => s.action === 'hold').length || 0,
        avgConfidence: allTimeSignals?.length ? 
          allTimeSignals.reduce((sum: number, s: any) => sum + s.confidence, 0) / allTimeSignals.length : 0,
      };
    }

    return NextResponse.json({
      data: {
        summary,
        recentSignals: recentSignals?.slice(0, 10) || [], // Latest 10 signals
        supportedAssets: {
          stocks: DEFAULT_STOCK_SYMBOLS,
          crypto: geminiService.isConfigured() ? DEFAULT_CRYPTO_SYMBOLS : [],
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching batch signal summary:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch batch signal summary' },
      { status: 500 }
    );
  }
}