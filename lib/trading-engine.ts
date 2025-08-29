import { supabaseAdmin } from './supabase';
import { SignalGenerator } from './signals';
import { TechnicalAnalysis } from './indicators';
import { monitorTradeExecution, monitorPortfolioAnalysis, reportCriticalError, trackBusinessMetric } from './monitoring';

export interface TradeParams {
  symbol: string;
  assetType: 'stock' | 'crypto';
  action: 'buy' | 'sell';
  quantity: number;
  price?: number;
  orderType: 'market' | 'limit' | 'stop_loss' | 'take_profit';
  stopLoss?: number;
  takeProfit?: number;
  userId: string;
  portfolioId: string;
  signalId?: string;
}

export interface TradeResult {
  success: boolean;
  orderId?: string;
  executedPrice?: number;
  executedQuantity?: number;
  fees?: number;
  error?: string;
  timestamp: Date;
}

export interface RiskManagementParams {
  maxPositionSize: number; // Maximum position size as percentage of portfolio
  maxDailyLoss: number; // Maximum daily loss as percentage
  stopLossPercentage: number; // Default stop loss percentage
  takeProfitPercentage: number; // Default take profit percentage
  maxOpenPositions: number; // Maximum number of open positions
  riskPerTrade: number; // Risk per trade as percentage of portfolio
}

export interface PortfolioMetrics {
  totalValue: number;
  totalCash: number;
  totalInvested: number;
  unrealizedPnL: number;
  realizedPnL: number;
  dayChange: number;
  dayChangePercent: number;
  openPositions: number;
  todayTrades: number;
}

class TradingEngine {
  private signalGenerator: SignalGenerator;
  private defaultRiskParams: RiskManagementParams;

  constructor() {
    this.signalGenerator = new SignalGenerator();
    this.defaultRiskParams = {
      maxPositionSize: 10, // 10% max position size
      maxDailyLoss: 5, // 5% max daily loss
      stopLossPercentage: 3, // 3% stop loss
      takeProfitPercentage: 6, // 6% take profit
      maxOpenPositions: 10, // Max 10 positions
      riskPerTrade: 2, // 2% risk per trade
    };
  }

  // Execute a trade based on trading signal
  async executeTrade(tradeParams: TradeParams): Promise<TradeResult> {
    try {
      // Validate trade parameters
      const validation = await this.validateTrade(tradeParams);
      if (!validation.valid) {
        return {
          success: false,
          error: `Trade validation failed: ${validation.errors.join(', ')}`,
          timestamp: new Date(),
        };
      }

      // Check risk management constraints
      const riskCheck = await this.checkRiskManagement(tradeParams);
      if (!riskCheck.allowed) {
        return {
          success: false,
          error: `Risk management violation: ${riskCheck.reason}`,
          timestamp: new Date(),
        };
      }

      // Execute the trade based on asset type
      let tradeResult: TradeResult;
      if (tradeParams.assetType === 'stock') {
        tradeResult = await this.executeStockTrade(tradeParams);
      } else {
        tradeResult = await this.executeCryptoTrade(tradeParams);
      }

      // Log the trade in database
      if (tradeResult.success) {
        await this.logTrade(tradeParams, tradeResult);
        await this.updatePortfolio(tradeParams.userId, tradeParams.portfolioId);
      }

      return tradeResult;
    } catch (error: any) {
      console.error('Trade execution error:', error);
      return {
        success: false,
        error: error.message || 'Unknown trade execution error',
        timestamp: new Date(),
      };
    }
  }

  // Execute stock trade via Alpaca
  private async executeStockTrade(tradeParams: TradeParams): Promise<TradeResult> {
    try {
      const { alpacaService } = await import('./alpaca');
      const orderParams = {
        symbol: tradeParams.symbol,
        qty: tradeParams.quantity,
        side: tradeParams.action,
        type: tradeParams.orderType === 'market' ? 'market' : 'limit' as 'market' | 'limit',
        timeInForce: 'day' as 'day',
        ...(tradeParams.price && { limitPrice: tradeParams.price }),
        ...(tradeParams.stopLoss && { stopPrice: tradeParams.stopLoss }),
      };

      const order = await alpacaService.placeOrder(orderParams);
      
      return {
        success: true,
        orderId: order.id,
        executedPrice: parseFloat((order.filledAvgPrice || 0).toString()),
        executedQuantity: parseFloat(order.filledQty.toString()),
        fees: 0, // Alpaca typically has no commission
        timestamp: new Date(order.submittedAt),
      };
    } catch (error: any) {
      throw new Error(`Stock trade execution failed: ${error.message}`);
    }
  }

  // Execute crypto trade via Gemini
  private async executeCryptoTrade(tradeParams: TradeParams): Promise<TradeResult> {
    try {
      const { geminiService } = await import('./gemini');
      if (!geminiService.isConfigured()) {
        throw new Error('Crypto trading not configured');
      }

      const orderParams = {
        symbol: tradeParams.symbol,
        amount: tradeParams.quantity,
        side: tradeParams.action,
        type: (tradeParams.orderType === 'market' 
          ? (tradeParams.action === 'buy' ? 'market buy' : 'market sell')
          : 'exchange limit') as 'exchange limit' | 'market buy' | 'market sell',
        ...(tradeParams.price && { price: tradeParams.price }),
      };

      const order = await geminiService.placeOrder(orderParams);
      
      return {
        success: true,
        orderId: order.orderId,
        executedPrice: order.avgExecutionPrice,
        executedQuantity: order.executedAmount,
        fees: 0.25, // Gemini fee estimate
        timestamp: order.timestamp,
      };
    } catch (error: any) {
      if (error.message.includes('not configured')) {
        throw new Error('Crypto trading not configured');
      }
      throw new Error(`Crypto trade execution failed: ${error.message}`);
    }
  }

  // Validate trade parameters
  private async validateTrade(tradeParams: TradeParams): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic parameter validation
    if (!tradeParams.symbol || tradeParams.symbol.trim() === '') {
      errors.push('Symbol is required');
    }

    if (!tradeParams.quantity || tradeParams.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (!['buy', 'sell'].includes(tradeParams.action)) {
      errors.push('Action must be buy or sell');
    }

    if (!['stock', 'crypto'].includes(tradeParams.assetType)) {
      errors.push('Asset type must be stock or crypto');
    }

    if (tradeParams.orderType === 'limit' && !tradeParams.price) {
      errors.push('Price is required for limit orders');
    }

    // Account validation
    try {
      if (tradeParams.assetType === 'stock') {
        const { alpacaService } = await import('./alpaca');
        const account = await alpacaService.getAccount();
        if (!account || account.status !== 'ACTIVE') {
          errors.push('Account not active');
        }
      } else {
        const { geminiService } = await import('./gemini');
        if (!geminiService.isConfigured()) {
          errors.push('Crypto trading not configured');
        }
      }
    } catch (error: any) {
      errors.push('Failed to validate account status');
    }

    // Check account status and buying power
    try {
      if (tradeParams.assetType === 'stock') {
        const { alpacaService } = await import('./alpaca');
        const account = await alpacaService.getAccount();
        const buyingPower = parseFloat(account.buyingPower.toString());
        
        if (tradeParams.action === 'buy') {
          const estimatedCost = tradeParams.quantity * (tradeParams.price || 0);
          if (estimatedCost > buyingPower) {
            errors.push('Insufficient buying power for this trade');
          }
        }
      } else if (tradeParams.assetType === 'crypto') {
        const { geminiService } = await import('./gemini');
        if (!geminiService.isConfigured()) {
          errors.push('Crypto trading not configured');
        }
      }
    } catch (error) {
      errors.push('Failed to validate account status');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Check risk management constraints
  private async checkRiskManagement(
    tradeParams: TradeParams,
    customRisk?: Partial<RiskManagementParams>
  ): Promise<{ allowed: boolean; reason?: string }> {
    const riskParams = { ...this.defaultRiskParams, ...customRisk };

    try {
      // Get current portfolio metrics
      const portfolio = await this.getPortfolioMetrics(tradeParams.userId, tradeParams.portfolioId);
      
      // Check daily loss limit
      if (portfolio.dayChangePercent <= -riskParams.maxDailyLoss) {
        return {
          allowed: false,
          reason: `Daily loss limit exceeded (${portfolio.dayChangePercent.toFixed(2)}%)`,
        };
      }

      // Check maximum open positions
      if (portfolio.openPositions >= riskParams.maxOpenPositions && tradeParams.action === 'buy') {
        return {
          allowed: false,
          reason: `Maximum open positions reached (${portfolio.openPositions})`,
        };
      }

      // Check position size limit
      const estimatedValue = tradeParams.quantity * (tradeParams.price || 0);
      const positionSizePercent = (estimatedValue / portfolio.totalValue) * 100;
      
      if (positionSizePercent > riskParams.maxPositionSize && tradeParams.action === 'buy') {
        return {
          allowed: false,
          reason: `Position size too large (${positionSizePercent.toFixed(2)}% > ${riskParams.maxPositionSize}%)`,
        };
      }

      return { allowed: true };
    } catch (error) {
      return {
        allowed: false,
        reason: 'Failed to evaluate risk management constraints',
      };
    }
  }

  // Get current portfolio metrics
  async getPortfolioMetrics(userId: string, portfolioId: string): Promise<PortfolioMetrics> {
    if (!supabaseAdmin) {
      throw new Error('Database not available');
    }

    try {
      // Get portfolio data
      const { data: portfolio, error: portfolioError } = await supabaseAdmin
        .from('portfolios')
        .select('*')
        .eq('id', portfolioId)
        .eq('user_id', userId)
        .single();

      if (portfolioError) throw portfolioError;

      // Get current positions
      const { data: positions, error: positionsError } = await supabaseAdmin
        .from('positions')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .gt('quantity', 0);

      if (positionsError) throw positionsError;

      // Get today's trades
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayTrades, error: tradesError } = await supabaseAdmin
        .from('trades')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .gte('timestamp', today.toISOString());

      if (tradesError) throw tradesError;

      // Calculate metrics
      let totalInvested = 0;
      let unrealizedPnL = 0;

      for (const position of positions || []) {
        const positionValue = (position as any).quantity * (position as any).average_price;
        totalInvested += positionValue;
        
        // Get current price for unrealized P&L calculation
        try {
          let currentPrice = 0;
          if ((position as any).asset_type === 'stock') {
            const { alpacaService } = await import('./alpaca');
            const quote = await alpacaService.getLatestQuote((position as any).symbol);
            currentPrice = (quote.bidPrice + quote.askPrice) / 2;
          } else {
            const { geminiService } = await import('./gemini');
            const ticker = await geminiService.getTicker((position as any).symbol);
            currentPrice = ticker.price;
          }
          
          const currentValue = (position as any).quantity * currentPrice;
          unrealizedPnL += currentValue - positionValue;
        } catch (error) {
          console.warn(`Failed to get current price for ${(position as any).symbol}`);
        }
      }

      const totalValue = (portfolio as any).cash_balance + totalInvested + unrealizedPnL;
      const dayChange = (todayTrades || []).reduce((sum: number, trade: any) => sum + (trade.realized_pnl || 0), 0);
      const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

      return {
        totalValue,
        totalCash: (portfolio as any).cash_balance,
        totalInvested,
        unrealizedPnL,
        realizedPnL: (portfolio as any).total_pnl,
        dayChange,
        dayChangePercent,
        openPositions: positions?.length || 0,
        todayTrades: todayTrades?.length || 0,
      };
    } catch (error: any) {
      throw new Error(`Failed to get portfolio metrics: ${error.message}`);
    }
  }

  // Log trade in database
  private async logTrade(tradeParams: TradeParams, result: TradeResult): Promise<void> {
    if (!supabaseAdmin || !result.success) return;

    try {
      const tradeData = {
        portfolio_id: tradeParams.portfolioId,
        signal_id: tradeParams.signalId,
        symbol: tradeParams.symbol,
        asset_type: tradeParams.assetType,
        action: tradeParams.action,
        quantity: result.executedQuantity || tradeParams.quantity,
        price: result.executedPrice || tradeParams.price || 0,
        order_type: tradeParams.orderType,
        stop_loss: tradeParams.stopLoss,
        take_profit: tradeParams.takeProfit,
        fees: result.fees || 0,
        external_order_id: result.orderId,
        status: 'executed',
        timestamp: result.timestamp.toISOString(),
      };

      await supabaseAdmin.from('trades').insert([tradeData] as any);
    } catch (error) {
      console.error('Failed to log trade:', error);
    }
  }

  // Update portfolio after trade
  private async updatePortfolio(userId: string, portfolioId: string): Promise<void> {
    if (!supabaseAdmin) return;

    try {
      // Call the update_portfolio_performance function
      await supabaseAdmin.rpc('update_portfolio_performance', {
        portfolio_id: portfolioId,
      } as any);
    } catch (error) {
      console.error('Failed to update portfolio:', error);
    }
  }

  // Process automated trading based on signals
  async processAutomatedTrading(userId: string, portfolioId: string): Promise<{
    processed: number;
    executed: number;
    failed: number;
    results: any[];
  }> {
    if (!supabaseAdmin) {
      throw new Error('Database not available');
    }

    const results = [];
    let processed = 0;
    let executed = 0;
    let failed = 0;

    try {
      // Get pending trading signals
      const { data: signals, error } = await supabaseAdmin
        .from('trading_signals')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .eq('action', 'buy') // Only process buy signals for now
        .gte('confidence', 0.7) // High confidence signals only
        .order('confidence', { ascending: false });

      if (error) throw error;

      // Get portfolio metrics for position sizing
      const portfolioMetrics = await this.getPortfolioMetrics(userId, portfolioId);

      for (const signal of signals || []) {
        processed++;

        try {
          // Calculate position size based on risk management
          const positionValue = portfolioMetrics.totalValue * (this.defaultRiskParams.riskPerTrade / 100);
          const quantity = Math.floor(positionValue / ((signal as any).target_price || (signal as any).indicators?.sma20 || 100));

          if (quantity <= 0) {
            results.push({
              signal: (signal as any).id,
              success: false,
              error: 'Position size too small',
            });
            failed++;
            continue;
          }

          // Create trade parameters
          const tradeParams: TradeParams = {
            symbol: (signal as any).symbol,
            assetType: (signal as any).asset_type as 'stock' | 'crypto',
            action: (signal as any).action as 'buy' | 'sell',
            quantity,
            price: (signal as any).target_price,
            orderType: 'limit',
            stopLoss: (signal as any).stop_loss,
            takeProfit: (signal as any).take_profit,
            userId,
            portfolioId,
            signalId: (signal as any).id,
          };

          // Execute the trade
          const tradeResult = await this.executeTrade(tradeParams);

          if (tradeResult.success) {
            executed++;
          } else {
            failed++;
          }

          results.push({
            signal: (signal as any).id,
            symbol: (signal as any).symbol,
            success: tradeResult.success,
            error: tradeResult.error,
            orderId: tradeResult.orderId,
          });

        } catch (error: any) {
          failed++;
          results.push({
            signal: (signal as any).id,
            success: false,
            error: error.message,
          });
        }
      }

      return {
        processed,
        executed,
        failed,
        results,
      };
    } catch (error: any) {
      throw new Error(`Automated trading processing failed: ${error.message}`);
    }
  }
}

export const tradingEngine = new TradingEngine();
export { TradingEngine };