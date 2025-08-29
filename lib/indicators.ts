// Types for technical indicators
export interface PriceData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
  timestamp: Date;
}

export interface RSIResult {
  rsi: number;
  timestamp: Date;
}

export interface StochasticResult {
  k: number;
  d: number;
  timestamp: Date;
}

export interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
  timestamp: Date;
}

export interface MovingAverageResult {
  value: number;
  timestamp: Date;
}

export interface VolumeWeightedResult {
  vwap: number;
  timestamp: Date;
}

export interface TechnicalIndicators {
  symbol: string;
  timestamp: Date;
  macd: MACDResult | null;
  rsi: RSIResult | null;
  stochastic: StochasticResult | null;
  bollingerBands: BollingerBandsResult | null;
  sma20: MovingAverageResult | null;
  sma50: MovingAverageResult | null;
  ema12: MovingAverageResult | null;
  ema26: MovingAverageResult | null;
  vwap: VolumeWeightedResult | null;
}

class TechnicalAnalysis {
  // Simple Moving Average
  static calculateSMA(prices: number[], period: number): number[] {
    if (prices.length < period) return [];
    
    const result: number[] = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    
    return result;
  }

  // Exponential Moving Average
  static calculateEMA(prices: number[], period: number): number[] {
    if (prices.length < period) return [];
    
    const result: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA for the first value
    const firstSMA = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(firstSMA);
    
    for (let i = period; i < prices.length; i++) {
      const ema = (prices[i] - result[result.length - 1]) * multiplier + result[result.length - 1];
      result.push(ema);
    }
    
    return result;
  }

  // MACD (Moving Average Convergence Divergence)
  static calculateMACD(
    prices: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ): { macd: number[]; signal: number[]; histogram: number[] } {
    const ema12 = this.calculateEMA(prices, fastPeriod);
    const ema26 = this.calculateEMA(prices, slowPeriod);
    
    // MACD line = EMA12 - EMA26
    const macdLine: number[] = [];
    const startIndex = Math.max(0, slowPeriod - fastPeriod);
    
    for (let i = startIndex; i < ema12.length; i++) {
      const ema26Index = i - startIndex;
      if (ema26Index < ema26.length) {
        macdLine.push(ema12[i] - ema26[ema26Index]);
      }
    }
    
    // Signal line = EMA of MACD line
    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    
    // Histogram = MACD - Signal
    const histogram: number[] = [];
    const signalStartIndex = macdLine.length - signalLine.length;
    
    for (let i = 0; i < signalLine.length; i++) {
      histogram.push(macdLine[signalStartIndex + i] - signalLine[i]);
    }
    
    return {
      macd: macdLine,
      signal: signalLine,
      histogram: histogram
    };
  }

  // RSI (Relative Strength Index)
  static calculateRSI(prices: number[], period: number = 14): number[] {
    if (prices.length < period + 1) return [];
    
    const gains: number[] = [];
    const losses: number[] = [];
    
    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const result: number[] = [];
    
    // Calculate initial average gain and loss
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    // Calculate RSI for the first value
    const rs1 = avgGain / avgLoss;
    result.push(100 - (100 / (1 + rs1)));
    
    // Calculate subsequent RSI values using Wilder's smoothing
    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      
      const rs = avgGain / avgLoss;
      result.push(100 - (100 / (1 + rs)));
    }
    
    return result;
  }

  // Stochastic Oscillator
  static calculateStochastic(
    highs: number[],
    lows: number[],
    closes: number[],
    kPeriod: number = 14,
    kSlowing: number = 3,
    dPeriod: number = 3
  ): { k: number[]; d: number[] } {
    if (highs.length < kPeriod || lows.length < kPeriod || closes.length < kPeriod) {
      return { k: [], d: [] };
    }
    
    const rawK: number[] = [];
    
    // Calculate %K
    for (let i = kPeriod - 1; i < closes.length; i++) {
      const periodHigh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
      const periodLow = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
      const currentClose = closes[i];
      
      if (periodHigh === periodLow) {
        rawK.push(50); // Avoid division by zero
      } else {
        rawK.push(((currentClose - periodLow) / (periodHigh - periodLow)) * 100);
      }
    }
    
    // Smooth %K
    const k = this.calculateSMA(rawK, kSlowing);
    
    // Calculate %D (SMA of %K)
    const d = this.calculateSMA(k, dPeriod);
    
    return { k, d };
  }

  // Bollinger Bands
  static calculateBollingerBands(
    prices: number[],
    period: number = 20,
    stdDevMultiplier: number = 2
  ): { upper: number[]; middle: number[]; lower: number[] } {
    const sma = this.calculateSMA(prices, period);
    const upper: number[] = [];
    const lower: number[] = [];
    
    for (let i = 0; i < sma.length; i++) {
      const dataIndex = i + period - 1;
      const subset = prices.slice(dataIndex - period + 1, dataIndex + 1);
      
      // Calculate standard deviation
      const mean = sma[i];
      const variance = subset.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      
      upper.push(mean + (stdDevMultiplier * stdDev));
      lower.push(mean - (stdDevMultiplier * stdDev));
    }
    
    return {
      upper,
      middle: sma,
      lower
    };
  }

  // Volume Weighted Average Price (VWAP)
  static calculateVWAP(prices: PriceData[]): number[] {
    const result: number[] = [];
    let cumulativeVolume = 0;
    let cumulativeVolumePrice = 0;
    
    for (const data of prices) {
      const typicalPrice = (data.high + data.low + data.close) / 3;
      cumulativeVolumePrice += typicalPrice * data.volume;
      cumulativeVolume += data.volume;
      
      if (cumulativeVolume > 0) {
        result.push(cumulativeVolumePrice / cumulativeVolume);
      } else {
        result.push(typicalPrice);
      }
    }
    
    return result;
  }

  // Williams %R
  static calculateWilliamsR(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number = 14
  ): number[] {
    if (highs.length < period) return [];
    
    const result: number[] = [];
    
    for (let i = period - 1; i < closes.length; i++) {
      const periodHigh = Math.max(...highs.slice(i - period + 1, i + 1));
      const periodLow = Math.min(...lows.slice(i - period + 1, i + 1));
      const currentClose = closes[i];
      
      if (periodHigh === periodLow) {
        result.push(-50); // Avoid division by zero
      } else {
        const williamsR = ((periodHigh - currentClose) / (periodHigh - periodLow)) * -100;
        result.push(williamsR);
      }
    }
    
    return result;
  }

  // Average True Range (ATR)
  static calculateATR(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number = 14
  ): number[] {
    if (highs.length < 2) return [];
    
    const trueRanges: number[] = [];
    
    // Calculate True Range for each period
    for (let i = 1; i < highs.length; i++) {
      const high = highs[i];
      const low = lows[i];
      const previousClose = closes[i - 1];
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - previousClose);
      const tr3 = Math.abs(low - previousClose);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    // Calculate ATR (smoothed average of True Range)
    return this.calculateSMA(trueRanges, period);
  }

  // Generate comprehensive indicators for a symbol
  static generateIndicators(
    symbol: string,
    priceData: PriceData[]
  ): TechnicalIndicators[] {
    if (priceData.length < 50) {
      throw new Error('Insufficient data for technical analysis (minimum 50 periods required)');
    }

    const closes = priceData.map(d => d.close);
    const highs = priceData.map(d => d.high);
    const lows = priceData.map(d => d.low);
    const volumes = priceData.map(d => d.volume);
    
    // Calculate all indicators
    const macdData = this.calculateMACD(closes);
    const rsiData = this.calculateRSI(closes);
    const stochasticData = this.calculateStochastic(highs, lows, closes);
    const bollingerData = this.calculateBollingerBands(closes);
    const sma20Data = this.calculateSMA(closes, 20);
    const sma50Data = this.calculateSMA(closes, 50);
    const ema12Data = this.calculateEMA(closes, 12);
    const ema26Data = this.calculateEMA(closes, 26);
    const vwapData = this.calculateVWAP(priceData);
    
    const result: TechnicalIndicators[] = [];
    
    // Start from the index where we have all indicators
    const startIndex = Math.max(
      priceData.length - macdData.macd.length,
      priceData.length - rsiData.length,
      priceData.length - stochasticData.k.length,
      priceData.length - bollingerData.middle.length,
      priceData.length - sma20Data.length,
      priceData.length - sma50Data.length,
      26 // EMA26 needs 26 periods
    );
    
    for (let i = startIndex; i < priceData.length; i++) {
      const dataIndex = i - startIndex;
      const timestamp = priceData[i].timestamp;
      
      const indicators: TechnicalIndicators = {
        symbol,
        timestamp,
        macd: macdData.macd.length > dataIndex ? {
          macd: macdData.macd[dataIndex],
          signal: macdData.signal[dataIndex] || 0,
          histogram: macdData.histogram[dataIndex] || 0,
          timestamp
        } : null,
        rsi: rsiData.length > dataIndex ? {
          rsi: rsiData[dataIndex],
          timestamp
        } : null,
        stochastic: stochasticData.k.length > dataIndex ? {
          k: stochasticData.k[dataIndex],
          d: stochasticData.d[dataIndex] || 0,
          timestamp
        } : null,
        bollingerBands: bollingerData.middle.length > dataIndex ? {
          upper: bollingerData.upper[dataIndex],
          middle: bollingerData.middle[dataIndex],
          lower: bollingerData.lower[dataIndex],
          timestamp
        } : null,
        sma20: sma20Data.length > dataIndex ? {
          value: sma20Data[dataIndex],
          timestamp
        } : null,
        sma50: sma50Data.length > dataIndex ? {
          value: sma50Data[dataIndex],
          timestamp
        } : null,
        ema12: ema12Data.length > dataIndex ? {
          value: ema12Data[dataIndex],
          timestamp
        } : null,
        ema26: ema26Data.length > dataIndex ? {
          value: ema26Data[dataIndex],
          timestamp
        } : null,
        vwap: vwapData.length > i ? {
          vwap: vwapData[i],
          timestamp
        } : null
      };
      
      result.push(indicators);
    }
    
    return result;
  }

  // Helper function to get the latest indicators
  static getLatestIndicators(
    symbol: string,
    priceData: PriceData[]
  ): TechnicalIndicators | null {
    const indicators = this.generateIndicators(symbol, priceData);
    return indicators.length > 0 ? indicators[indicators.length - 1] : null;
  }

  // Validate if we have sufficient data for analysis
  static validateDataSufficiency(priceData: PriceData[]): {
    valid: boolean;
    missing: string[];
    recommendations: string[];
  } {
    const missing: string[] = [];
    const recommendations: string[] = [];

    if (priceData.length < 26) {
      missing.push('Insufficient data for MACD calculation (need 26+ periods)');
    }

    if (priceData.length < 14) {
      missing.push('Insufficient data for RSI calculation (need 14+ periods)');
    }

    if (priceData.length < 20) {
      missing.push('Insufficient data for Bollinger Bands (need 20+ periods)');
    }

    if (priceData.length < 50) {
      recommendations.push('Recommend 50+ periods for reliable SMA50 calculation');
    }

    if (priceData.length < 100) {
      recommendations.push('Recommend 100+ periods for stable technical analysis');
    }

    return {
      valid: missing.length === 0,
      missing,
      recommendations
    };
  }
}

export { TechnicalAnalysis };