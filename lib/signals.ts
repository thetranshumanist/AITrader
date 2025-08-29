import { TechnicalIndicators, TechnicalAnalysis, PriceData } from './indicators';

// Types for trading signals
export interface TradingSignal {
  id: string;
  symbol: string;
  assetType: 'stock' | 'crypto';
  action: 'buy' | 'sell' | 'hold';
  confidence: number; // 0-1
  reasoning: string[];
  price: number;
  targetPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  timestamp: Date;
  indicators: TechnicalIndicators;
  strategies: StrategyResult[];
}

export interface StrategyResult {
  name: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  weight: number;
  reasoning: string[];
}

export interface StrategyWeights {
  macd: number;
  rsi: number;
  stochastic: number;
  bollingerBands: number;
  movingAverages: number;
  volume: number;
}

export interface RiskParameters {
  maxPositionSize: number; // Percentage of portfolio
  stopLossPercentage: number;
  takeProfitRatio: number; // Ratio to stop loss
  maxDailyLoss: number;
  maxDrawdown: number;
  minConfidence: number; // Minimum confidence to execute
}

class SignalGenerator {
  private defaultWeights: StrategyWeights = {
    macd: 0.25,
    rsi: 0.20,
    stochastic: 0.15,
    bollingerBands: 0.20,
    movingAverages: 0.15,
    volume: 0.05,
  };

  private defaultRisk: RiskParameters = {
    maxPositionSize: 5, // 5% of portfolio per position
    stopLossPercentage: 2, // 2% stop loss
    takeProfitRatio: 3, // 3:1 reward-to-risk ratio
    maxDailyLoss: 10, // 10% max daily loss
    maxDrawdown: 20, // 20% max drawdown
    minConfidence: 0.65, // 65% minimum confidence
  };

  // MACD Strategy
  private analyzeMACDStrategy(indicators: TechnicalIndicators): StrategyResult {
    const reasoning: string[] = [];
    let action: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 0;

    if (!indicators.macd) {
      return {
        name: 'MACD',
        action: 'hold',
        confidence: 0,
        weight: this.defaultWeights.macd,
        reasoning: ['MACD data not available'],
      };
    }

    const { macd, signal, histogram } = indicators.macd;

    // MACD line crossing above signal line (bullish)
    if (macd > signal && histogram > 0) {
      action = 'buy';
      confidence += 0.6;
      reasoning.push('MACD line crossed above signal line');
      
      if (histogram > 0.001) {
        confidence += 0.2;
        reasoning.push('Strong positive histogram momentum');
      }
    }
    // MACD line crossing below signal line (bearish)
    else if (macd < signal && histogram < 0) {
      action = 'sell';
      confidence += 0.6;
      reasoning.push('MACD line crossed below signal line');
      
      if (histogram < -0.001) {
        confidence += 0.2;
        reasoning.push('Strong negative histogram momentum');
      }
    }

    // Additional MACD signals
    if (macd > 0 && signal > 0) {
      confidence += 0.1;
      reasoning.push('MACD in positive territory');
    } else if (macd < 0 && signal < 0) {
      confidence += 0.1;
      reasoning.push('MACD in negative territory');
    }

    return {
      name: 'MACD',
      action,
      confidence: Math.min(confidence, 1),
      weight: this.defaultWeights.macd,
      reasoning,
    };
  }

  // RSI Strategy
  private analyzeRSIStrategy(indicators: TechnicalIndicators): StrategyResult {
    const reasoning: string[] = [];
    let action: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 0;

    if (!indicators.rsi) {
      return {
        name: 'RSI',
        action: 'hold',
        confidence: 0,
        weight: this.defaultWeights.rsi,
        reasoning: ['RSI data not available'],
      };
    }

    const rsi = indicators.rsi.rsi;

    // Oversold condition (potential buy)
    if (rsi < 30) {
      action = 'buy';
      confidence = 0.8;
      reasoning.push(`RSI oversold at ${rsi.toFixed(2)}`);
      
      if (rsi < 20) {
        confidence = 1.0;
        reasoning.push('Extremely oversold condition');
      }
    }
    // Overbought condition (potential sell)
    else if (rsi > 70) {
      action = 'sell';
      confidence = 0.8;
      reasoning.push(`RSI overbought at ${rsi.toFixed(2)}`);
      
      if (rsi > 80) {
        confidence = 1.0;
        reasoning.push('Extremely overbought condition');
      }
    }
    // Neutral zone
    else if (rsi >= 40 && rsi <= 60) {
      action = 'hold';
      confidence = 0.3;
      reasoning.push(`RSI neutral at ${rsi.toFixed(2)}`);
    }

    return {
      name: 'RSI',
      action,
      confidence,
      weight: this.defaultWeights.rsi,
      reasoning,
    };
  }

  // Stochastic Strategy
  private analyzeStochasticStrategy(indicators: TechnicalIndicators): StrategyResult {
    const reasoning: string[] = [];
    let action: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 0;

    if (!indicators.stochastic) {
      return {
        name: 'Stochastic',
        action: 'hold',
        confidence: 0,
        weight: this.defaultWeights.stochastic,
        reasoning: ['Stochastic data not available'],
      };
    }

    const { k, d } = indicators.stochastic;

    // Oversold with bullish crossover
    if (k < 20 && d < 20 && k > d) {
      action = 'buy';
      confidence = 0.9;
      reasoning.push(`Stochastic oversold with bullish crossover (K=${k.toFixed(2)}, D=${d.toFixed(2)})`);
    }
    // Overbought with bearish crossover
    else if (k > 80 && d > 80 && k < d) {
      action = 'sell';
      confidence = 0.9;
      reasoning.push(`Stochastic overbought with bearish crossover (K=${k.toFixed(2)}, D=${d.toFixed(2)})`);
    }
    // Simple oversold/overbought
    else if (k < 20 && d < 20) {
      action = 'buy';
      confidence = 0.6;
      reasoning.push(`Stochastic oversold (K=${k.toFixed(2)}, D=${d.toFixed(2)})`);
    } else if (k > 80 && d > 80) {
      action = 'sell';
      confidence = 0.6;
      reasoning.push(`Stochastic overbought (K=${k.toFixed(2)}, D=${d.toFixed(2)})`);
    }

    return {
      name: 'Stochastic',
      action,
      confidence,
      weight: this.defaultWeights.stochastic,
      reasoning,
    };
  }

  // Bollinger Bands Strategy
  private analyzeBollingerBandsStrategy(indicators: TechnicalIndicators): StrategyResult {
    const reasoning: string[] = [];
    let action: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 0;

    if (!indicators.bollingerBands) {
      return {
        name: 'Bollinger Bands',
        action: 'hold',
        confidence: 0,
        weight: this.defaultWeights.bollingerBands,
        reasoning: ['Bollinger Bands data not available'],
      };
    }

    // Assuming current price is the middle band value for simplification
    // In a real scenario, you'd have the current price passed separately
    const { upper, middle, lower } = indicators.bollingerBands;
    const currentPrice = middle; // This should be the actual current price
    
    const bandWidth = upper - lower;
    const position = (currentPrice - lower) / bandWidth;

    // Price near lower band (oversold)
    if (position < 0.1) {
      action = 'buy';
      confidence = 0.8;
      reasoning.push('Price near lower Bollinger Band (oversold)');
    }
    // Price near upper band (overbought)
    else if (position > 0.9) {
      action = 'sell';
      confidence = 0.8;
      reasoning.push('Price near upper Bollinger Band (overbought)');
    }
    // Price in middle range
    else if (position >= 0.4 && position <= 0.6) {
      action = 'hold';
      confidence = 0.5;
      reasoning.push('Price in middle of Bollinger Bands');
    }

    // Band squeeze detection
    const avgPrice = (upper + lower) / 2;
    const bandWidthPercent = (bandWidth / avgPrice) * 100;
    
    if (bandWidthPercent < 10) {
      reasoning.push('Bollinger Band squeeze detected - volatility breakout expected');
      confidence += 0.2;
    }

    return {
      name: 'Bollinger Bands',
      action,
      confidence: Math.min(confidence, 1),
      weight: this.defaultWeights.bollingerBands,
      reasoning,
    };
  }

  // Moving Averages Strategy
  private analyzeMovingAveragesStrategy(indicators: TechnicalIndicators): StrategyResult {
    const reasoning: string[] = [];
    let action: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 0;

    if (!indicators.sma20 || !indicators.sma50 || !indicators.ema12 || !indicators.ema26) {
      return {
        name: 'Moving Averages',
        action: 'hold',
        confidence: 0,
        weight: this.defaultWeights.movingAverages,
        reasoning: ['Moving averages data not available'],
      };
    }

    const sma20 = indicators.sma20.value;
    const sma50 = indicators.sma50.value;
    const ema12 = indicators.ema12.value;
    const ema26 = indicators.ema26.value;

    // Golden Cross (SMA20 > SMA50)
    if (sma20 > sma50) {
      action = 'buy';
      confidence += 0.4;
      reasoning.push('Golden Cross: SMA20 above SMA50');
    }
    // Death Cross (SMA20 < SMA50)
    else if (sma20 < sma50) {
      action = 'sell';
      confidence += 0.4;
      reasoning.push('Death Cross: SMA20 below SMA50');
    }

    // EMA Momentum
    if (ema12 > ema26) {
      if (action === 'buy') {
        confidence += 0.3;
        reasoning.push('EMA12 above EMA26 confirms bullish momentum');
      } else if (action === 'hold') {
        action = 'buy';
        confidence = 0.3;
        reasoning.push('EMA12 above EMA26 indicates bullish momentum');
      }
    } else if (ema12 < ema26) {
      if (action === 'sell') {
        confidence += 0.3;
        reasoning.push('EMA12 below EMA26 confirms bearish momentum');
      } else if (action === 'hold') {
        action = 'sell';
        confidence = 0.3;
        reasoning.push('EMA12 below EMA26 indicates bearish momentum');
      }
    }

    return {
      name: 'Moving Averages',
      action,
      confidence: Math.min(confidence, 1),
      weight: this.defaultWeights.movingAverages,
      reasoning,
    };
  }

  // Volume Analysis Strategy
  private analyzeVolumeStrategy(
    indicators: TechnicalIndicators,
    priceData: PriceData[]
  ): StrategyResult {
    const reasoning: string[] = [];
    let action: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 0;

    if (!indicators.vwap || priceData.length < 20) {
      return {
        name: 'Volume Analysis',
        action: 'hold',
        confidence: 0,
        weight: this.defaultWeights.volume,
        reasoning: ['Volume data not available'],
      };
    }

    const currentVWAP = indicators.vwap.vwap;
    const recentData = priceData.slice(-20);
    const avgVolume = recentData.reduce((sum, d) => sum + d.volume, 0) / recentData.length;
    const currentVolume = priceData[priceData.length - 1].volume;
    const currentPrice = priceData[priceData.length - 1].close;

    // Volume confirmation
    const volumeRatio = currentVolume / avgVolume;
    
    if (volumeRatio > 1.5) {
      confidence += 0.3;
      reasoning.push(`High volume confirmation (${volumeRatio.toFixed(2)}x average)`);
    } else if (volumeRatio < 0.5) {
      confidence -= 0.2;
      reasoning.push(`Low volume warning (${volumeRatio.toFixed(2)}x average)`);
    }

    // VWAP analysis
    if (currentPrice > currentVWAP * 1.02) {
      action = 'sell';
      confidence += 0.4;
      reasoning.push('Price above VWAP indicates selling pressure');
    } else if (currentPrice < currentVWAP * 0.98) {
      action = 'buy';
      confidence += 0.4;
      reasoning.push('Price below VWAP indicates buying opportunity');
    }

    return {
      name: 'Volume Analysis',
      action,
      confidence: Math.max(0, Math.min(confidence, 1)),
      weight: this.defaultWeights.volume,
      reasoning,
    };
  }

  // Calculate position sizing based on risk parameters
  private calculatePositionSize(
    portfolioValue: number,
    entryPrice: number,
    stopLossPrice: number,
    riskParams: RiskParameters
  ): number {
    // Position size based on portfolio percentage
    const maxPositionValue = portfolioValue * (riskParams.maxPositionSize / 100);
    
    // Position size based on stop loss risk
    const riskPerShare = Math.abs(entryPrice - stopLossPrice);
    const riskAmount = portfolioValue * (riskParams.stopLossPercentage / 100);
    const maxSharesByRisk = riskAmount / riskPerShare;
    
    // Take the smaller of the two
    const maxShares = Math.min(
      maxPositionValue / entryPrice,
      maxSharesByRisk
    );
    
    return Math.floor(maxShares);
  }

  // Calculate stop loss and take profit levels
  private calculateRiskLevels(
    entryPrice: number,
    action: 'buy' | 'sell',
    riskParams: RiskParameters
  ): { stopLoss: number; takeProfit: number } {
    const stopLossDistance = entryPrice * (riskParams.stopLossPercentage / 100);
    const takeProfitDistance = stopLossDistance * riskParams.takeProfitRatio;

    if (action === 'buy') {
      return {
        stopLoss: entryPrice - stopLossDistance,
        takeProfit: entryPrice + takeProfitDistance,
      };
    } else {
      return {
        stopLoss: entryPrice + stopLossDistance,
        takeProfit: entryPrice - takeProfitDistance,
      };
    }
  }

  // Generate comprehensive trading signal
  generateSignal(
    symbol: string,
    assetType: 'stock' | 'crypto',
    indicators: TechnicalIndicators,
    priceData: PriceData[],
    currentPrice: number,
    portfolioValue: number = 100000,
    customWeights?: Partial<StrategyWeights>,
    customRisk?: Partial<RiskParameters>
  ): TradingSignal {
    const weights = { ...this.defaultWeights, ...customWeights };
    const riskParams = { ...this.defaultRisk, ...customRisk };

    // Run all strategies
    const strategies: StrategyResult[] = [
      this.analyzeMACDStrategy(indicators),
      this.analyzeRSIStrategy(indicators),
      this.analyzeStochasticStrategy(indicators),
      this.analyzeBollingerBandsStrategy(indicators),
      this.analyzeMovingAveragesStrategy(indicators),
      this.analyzeVolumeStrategy(indicators, priceData),
    ];

    // Calculate weighted scores
    let buyScore = 0;
    let sellScore = 0;
    const allReasoning: string[] = [];

    strategies.forEach(strategy => {
      const weightedConfidence = strategy.confidence * strategy.weight;
      
      if (strategy.action === 'buy') {
        buyScore += weightedConfidence;
      } else if (strategy.action === 'sell') {
        sellScore += weightedConfidence;
      }
      
      allReasoning.push(...strategy.reasoning.map(r => `${strategy.name}: ${r}`));
    });

    // Determine final action and confidence
    let finalAction: 'buy' | 'sell' | 'hold' = 'hold';
    let finalConfidence = 0;

    if (buyScore > sellScore && buyScore > riskParams.minConfidence) {
      finalAction = 'buy';
      finalConfidence = Math.min(buyScore, 1);
    } else if (sellScore > buyScore && sellScore > riskParams.minConfidence) {
      finalAction = 'sell';
      finalConfidence = Math.min(sellScore, 1);
    } else {
      finalConfidence = Math.abs(buyScore - sellScore);
      allReasoning.push('Signal confidence below minimum threshold');
    }

    // Calculate risk levels
    const riskLevels = finalAction !== 'hold' 
      ? this.calculateRiskLevels(currentPrice, finalAction, riskParams)
      : { stopLoss: 0, takeProfit: 0 };

    // Generate signal ID
    const signalId = `${symbol}_${assetType}_${Date.now()}`;

    return {
      id: signalId,
      symbol,
      assetType,
      action: finalAction,
      confidence: finalConfidence,
      reasoning: allReasoning,
      price: currentPrice,
      targetPrice: riskLevels.takeProfit || undefined,
      stopLoss: riskLevels.stopLoss || undefined,
      takeProfit: riskLevels.takeProfit || undefined,
      timestamp: new Date(),
      indicators,
      strategies,
    };
  }

  // Batch generate signals for multiple symbols
  async generateMultipleSignals(
    symbols: { symbol: string; assetType: 'stock' | 'crypto' }[],
    portfolioValue: number = 100000,
    customWeights?: Partial<StrategyWeights>,
    customRisk?: Partial<RiskParameters>
  ): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];

    for (const { symbol, assetType } of symbols) {
      try {
        // This would typically fetch the required data
        // For now, we'll return a placeholder
        console.log(`Generating signal for ${symbol} (${assetType})`);
        
        // In a real implementation, you would:
        // 1. Fetch price data
        // 2. Calculate indicators
        // 3. Generate signal
        
      } catch (error) {
        console.error(`Error generating signal for ${symbol}:`, error);
      }
    }

    return signals;
  }

  // Validate signal quality
  validateSignal(signal: TradingSignal): {
    valid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (signal.confidence < 0.5) {
      issues.push('Low confidence signal');
      recommendations.push('Consider additional confirmation');
    }

    if (signal.action !== 'hold' && (!signal.stopLoss || !signal.takeProfit)) {
      issues.push('Missing risk management levels');
      recommendations.push('Set stop loss and take profit levels');
    }

    if (signal.strategies.length < 3) {
      issues.push('Insufficient strategy analysis');
      recommendations.push('Include more technical indicators');
    }

    const activeStrategies = signal.strategies.filter(s => s.confidence > 0.3);
    if (activeStrategies.length < 2) {
      issues.push('Limited strategy consensus');
      recommendations.push('Wait for more indicators to align');
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations,
    };
  }
}

export { SignalGenerator };