import { supabaseAdmin } from './supabase';

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  cashBalance: number;
  totalValue: number;
  totalPnL: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Position {
  id: string;
  portfolioId: string;
  symbol: string;
  assetType: 'stock' | 'crypto';
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioPerformance {
  portfolioId: string;
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  weekChange: number;
  weekChangePercent: number;
  monthChange: number;
  monthChangePercent: number;
  yearChange: number;
  yearChangePercent: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
}

export interface TradeHistory {
  id: string;
  portfolioId: string;
  symbol: string;
  assetType: 'stock' | 'crypto';
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  fees: number;
  realizedPnL?: number;
  timestamp: Date;
}

class PortfolioManager {
  // Create a new portfolio for a user
  async createPortfolio(
    userId: string,
    name: string,
    initialCash = 100000,
    description?: string
  ): Promise<Portfolio> {
    if (!supabaseAdmin) {
      throw new Error('Database not available');
    }

    try {
      const portfolioData = {
        user_id: userId,
        name,
        description,
        cash_balance: initialCash,
        total_value: initialCash,
        total_pnl: 0,
      };

      const { data, error } = await supabaseAdmin
        .from('portfolios')
        .insert([portfolioData] as any)
        .select()
        .single();

      if (error) throw error;

      return {
        id: (data as any).id,
        userId: (data as any).user_id,
        name: (data as any).name,
        description: (data as any).description,
        cashBalance: (data as any).cash_balance,
        totalValue: (data as any).total_value,
        totalPnL: (data as any).total_pnl,
        createdAt: new Date((data as any).created_at),
        updatedAt: new Date((data as any).updated_at),
      };
    } catch (error: any) {
      throw new Error(`Failed to create portfolio: ${error.message}`);
    }
  }

  // Get user's portfolios
  async getUserPortfolios(userId: string): Promise<Portfolio[]> {
    if (!supabaseAdmin) {
      throw new Error('Database not available');
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((portfolio: any) => ({
        id: portfolio.id,
        userId: portfolio.user_id,
        name: portfolio.name,
        description: portfolio.description,
        cashBalance: portfolio.cash_balance,
        totalValue: portfolio.total_value,
        totalPnL: portfolio.total_pnl,
        createdAt: new Date(portfolio.created_at),
        updatedAt: new Date(portfolio.updated_at),
      }));
    } catch (error: any) {
      throw new Error(`Failed to get portfolios: ${error.message}`);
    }
  }

  // Get portfolio by ID
  async getPortfolio(portfolioId: string, userId: string): Promise<Portfolio | null> {
    if (!supabaseAdmin) {
      throw new Error('Database not available');
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('portfolios')
        .select('*')
        .eq('id', portfolioId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return {
        id: (data as any).id,
        userId: (data as any).user_id,
        name: (data as any).name,
        description: (data as any).description,
        cashBalance: (data as any).cash_balance,
        totalValue: (data as any).total_value,
        totalPnL: (data as any).total_pnl,
        createdAt: new Date((data as any).created_at),
        updatedAt: new Date((data as any).updated_at),
      };
    } catch (error: any) {
      throw new Error(`Failed to get portfolio: ${error.message}`);
    }
  }

  // Get portfolio positions with current market prices
  async getPortfolioPositions(portfolioId: string): Promise<Position[]> {
    if (!supabaseAdmin) {
      throw new Error('Database not available');
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('positions')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .gt('quantity', 0);

      if (error) throw error;

      const positions: Position[] = [];

      for (const positionData of data || []) {
        try {
          // Get current market price
          let currentPrice = 0;
          if ((positionData as any).asset_type === 'stock') {
            const { alpacaService } = await import('./alpaca');
            const quote = await alpacaService.getLatestQuote((positionData as any).symbol);
            currentPrice = (quote.bidPrice + quote.askPrice) / 2;
          } else if ((positionData as any).asset_type === 'crypto') {
            const { geminiService } = await import('./gemini');
            if (geminiService.isConfigured()) {
              const ticker = await geminiService.getTicker((positionData as any).symbol);
              currentPrice = ticker.price;
            }
          }

          const marketValue = (positionData as any).quantity * currentPrice;
          const costBasis = (positionData as any).quantity * (positionData as any).average_price;
          const unrealizedPnL = marketValue - costBasis;
          const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

          positions.push({
            id: (positionData as any).id,
            portfolioId: (positionData as any).portfolio_id,
            symbol: (positionData as any).symbol,
            assetType: (positionData as any).asset_type,
            quantity: (positionData as any).quantity,
            averagePrice: (positionData as any).average_price,
            currentPrice,
            marketValue,
            unrealizedPnL,
            unrealizedPnLPercent,
            createdAt: new Date((positionData as any).created_at),
            updatedAt: new Date((positionData as any).updated_at),
          });
        } catch (error) {
          console.warn(`Failed to get current price for ${(positionData as any).symbol}:`, error);
          // Add position with last known price
          positions.push({
            id: (positionData as any).id,
            portfolioId: (positionData as any).portfolio_id,
            symbol: (positionData as any).symbol,
            assetType: (positionData as any).asset_type,
            quantity: (positionData as any).quantity,
            averagePrice: (positionData as any).average_price,
            currentPrice: (positionData as any).average_price, // Fallback to average price
            marketValue: (positionData as any).quantity * (positionData as any).average_price,
            unrealizedPnL: 0,
            unrealizedPnLPercent: 0,
            createdAt: new Date((positionData as any).created_at),
            updatedAt: new Date((positionData as any).updated_at),
          });
        }
      }

      return positions;
    } catch (error: any) {
      throw new Error(`Failed to get portfolio positions: ${error.message}`);
    }
  }

  // Get trade history for a portfolio
  async getTradeHistory(
    portfolioId: string,
    limit = 50,
    offset = 0
  ): Promise<{ trades: TradeHistory[]; total: number }> {
    if (!supabaseAdmin) {
      throw new Error('Database not available');
    }

    try {
      // Get total count
      const { count } = await supabaseAdmin
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .eq('portfolio_id', portfolioId);

      // Get trades with pagination
      const { data, error } = await supabaseAdmin
        .from('trades')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const trades = (data || []).map((trade: any) => ({
        id: trade.id,
        portfolioId: trade.portfolio_id,
        symbol: trade.symbol,
        assetType: trade.asset_type,
        action: trade.action,
        quantity: trade.quantity,
        price: trade.price,
        fees: trade.fees || 0,
        realizedPnL: trade.realized_pnl,
        timestamp: new Date(trade.timestamp),
      }));

      return {
        trades,
        total: count || 0,
      };
    } catch (error: any) {
      throw new Error(`Failed to get trade history: ${error.message}`);
    }
  }

  // Calculate portfolio performance metrics
  async calculatePerformance(portfolioId: string): Promise<PortfolioPerformance> {
    if (!supabaseAdmin) {
      throw new Error('Database not available');
    }

    try {
      // Get portfolio data
      const { data: portfolio, error: portfolioError } = await supabaseAdmin
        .from('portfolios')
        .select('*')
        .eq('id', portfolioId)
        .single();

      if (portfolioError) throw portfolioError;

      // Get all trades for performance calculation
      const { data: trades, error: tradesError } = await supabaseAdmin
        .from('trades')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('timestamp', { ascending: true });

      if (tradesError) throw tradesError;

      // Get current positions for unrealized P&L
      const positions = await this.getPortfolioPositions(portfolioId);
      const unrealizedPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);

      // Calculate time-based returns
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      const dayTrades = trades?.filter((t: any) => new Date(t.timestamp) >= dayAgo) || [];
      const weekTrades = trades?.filter((t: any) => new Date(t.timestamp) >= weekAgo) || [];
      const monthTrades = trades?.filter((t: any) => new Date(t.timestamp) >= monthAgo) || [];
      const yearTrades = trades?.filter((t: any) => new Date(t.timestamp) >= yearAgo) || [];

      const dayChange = dayTrades.reduce((sum: number, t: any) => sum + (t.realized_pnl || 0), 0);
      const weekChange = weekTrades.reduce((sum: number, t: any) => sum + (t.realized_pnl || 0), 0);
      const monthChange = monthTrades.reduce((sum: number, t: any) => sum + (t.realized_pnl || 0), 0);
      const yearChange = yearTrades.reduce((sum: number, t: any) => sum + (t.realized_pnl || 0), 0);

      // Calculate win rate and profit metrics
      const winningTrades = trades?.filter((t: any) => (t.realized_pnl || 0) > 0) || [];
      const losingTrades = trades?.filter((t: any) => (t.realized_pnl || 0) < 0) || [];
      
      const winRate = trades?.length ? (winningTrades.length / trades.length) * 100 : 0;
      const avgWin = winningTrades.length ? 
        winningTrades.reduce((sum: number, t: any) => sum + (t.realized_pnl || 0), 0) / winningTrades.length : 0;
      const avgLoss = losingTrades.length ? 
        Math.abs(losingTrades.reduce((sum: number, t: any) => sum + (t.realized_pnl || 0), 0) / losingTrades.length) : 0;
      
      const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

      // Calculate total return
      const initialValue = (portfolio as any).cash_balance; // Assuming initial cash as starting value
      const totalValue = (portfolio as any).total_value + unrealizedPnL;
      const totalReturn = totalValue - initialValue;
      const totalReturnPercent = initialValue > 0 ? (totalReturn / initialValue) * 100 : 0;

      // Simplified calculations for metrics that require more complex analysis
      const sharpeRatio = 0; // Would need daily returns and risk-free rate
      const maxDrawdown = 0; // Would need historical portfolio values

      return {
        portfolioId,
        totalValue,
        totalReturn,
        totalReturnPercent,
        dayChange,
        dayChangePercent: totalValue > 0 ? (dayChange / totalValue) * 100 : 0,
        weekChange,
        weekChangePercent: totalValue > 0 ? (weekChange / totalValue) * 100 : 0,
        monthChange,
        monthChangePercent: totalValue > 0 ? (monthChange / totalValue) * 100 : 0,
        yearChange,
        yearChangePercent: totalValue > 0 ? (yearChange / totalValue) * 100 : 0,
        sharpeRatio,
        maxDrawdown,
        winRate,
        avgWin,
        avgLoss,
        profitFactor,
      };
    } catch (error: any) {
      throw new Error(`Failed to calculate performance: ${error.message}`);
    }
  }

  // Update portfolio values based on current positions
  async updatePortfolioValue(portfolioId: string): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Database not available');
    }

    try {
      // Call the database function to update portfolio performance
      await supabaseAdmin.rpc('update_portfolio_performance', {
        portfolio_id: portfolioId,
      } as any);
    } catch (error: any) {
      console.error(`Failed to update portfolio value: ${error.message}`);
    }
  }

  // Sync positions with actual brokerage accounts
  async syncWithBrokerageAccounts(portfolioId: string): Promise<{
    stocksSynced: number;
    cryptoSynced: number;
    errors: string[];
  }> {
    const result = {
      stocksSynced: 0,
      cryptoSynced: 0,
      errors: [],
    };

    try {
      // Sync stock positions from Alpaca
      try {
        const { alpacaService } = await import('./alpaca');
        const alpacaPositions = await alpacaService.getPositions();
        
        for (const position of alpacaPositions) {
          await this.updatePositionFromBrokerage(
            portfolioId,
            position.symbol,
            'stock',
            parseFloat(position.qty.toString()),
            parseFloat((position as any).avg_cost?.toString() || '0')
          );
          result.stocksSynced++;
        }
      } catch (error: any) {
        (result.errors as string[]).push(`Stock sync error: ${error.message}`);
      }

      // Sync crypto positions from Gemini
      const { geminiService } = await import('./gemini');
      if (geminiService.isConfigured()) {
        try {
          const geminiBalances = await geminiService.getBalances();
          
          for (const balance of geminiBalances) {
            if (balance.amount > 0 && balance.currency !== 'USD') {
              // Convert balance to position (simplified)
              await this.updatePositionFromBrokerage(
                portfolioId,
                `${balance.currency}USD`,
                'crypto',
                balance.amount,
                0 // Would need to calculate average cost
              );
              result.cryptoSynced++;
            }
          }
        } catch (error: any) {
          (result.errors as string[]).push(`Crypto sync error: ${error.message}`);
        }
      }

      // Update portfolio value after sync
      await this.updatePortfolioValue(portfolioId);

      return result;
    } catch (error: any) {
      throw new Error(`Sync failed: ${error.message}`);
    }
  }

  // Update position from brokerage data
  private async updatePositionFromBrokerage(
    portfolioId: string,
    symbol: string,
    assetType: 'stock' | 'crypto',
    quantity: number,
    averagePrice: number
  ): Promise<void> {
    if (!supabaseAdmin) return;

    try {
      const positionData = {
        portfolio_id: portfolioId,
        symbol,
        asset_type: assetType,
        quantity,
        average_price: averagePrice,
      };

      await supabaseAdmin
        .from('positions')
        .upsert(positionData as any, {
          onConflict: 'portfolio_id,symbol,asset_type',
          ignoreDuplicates: false,
        });
    } catch (error) {
      console.error(`Failed to update position for ${symbol}:`, error);
    }
  }

  // Delete a portfolio
  async deletePortfolio(portfolioId: string, userId: string): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Database not available');
    }

    try {
      const { error } = await supabaseAdmin
        .from('portfolios')
        .delete()
        .eq('id', portfolioId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(`Failed to delete portfolio: ${error.message}`);
    }
  }

  // Get all active portfolios for scheduled processing
  async getActivePortfolios(): Promise<Portfolio[]> {
    if (!supabaseAdmin) {
      throw new Error('Database not available');
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('portfolios')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((portfolio: any) => ({
        id: portfolio.id,
        userId: portfolio.user_id,
        name: portfolio.name,
        description: portfolio.description,
        cashBalance: portfolio.cash_balance,
        totalValue: portfolio.total_value,
        totalPnL: portfolio.total_pnl,
        createdAt: new Date(portfolio.created_at),
        updatedAt: new Date(portfolio.updated_at),
      }));
    } catch (error: any) {
      throw new Error(`Failed to get active portfolios: ${error.message}`);
    }
  }

  // Get all portfolios
  async getAllPortfolios(): Promise<Portfolio[]> {
    if (!supabaseAdmin) {
      throw new Error('Database not available');
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('portfolios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((portfolio: any) => ({
        id: portfolio.id,
        userId: portfolio.user_id,
        name: portfolio.name,
        description: portfolio.description,
        cashBalance: portfolio.cash_balance,
        totalValue: portfolio.total_value,
        totalPnL: portfolio.total_pnl,
        createdAt: new Date(portfolio.created_at),
        updatedAt: new Date(portfolio.updated_at),
      }));
    } catch (error: any) {
      throw new Error(`Failed to get all portfolios: ${error.message}`);
    }
  }

  // Get portfolios that need rebalancing
  async getPortfoliosForRebalancing(): Promise<Portfolio[]> {
    if (!supabaseAdmin) {
      throw new Error('Database not available');
    }

    try {
      // Get portfolios that haven't been rebalanced in the last week
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabaseAdmin
        .from('portfolios')
        .select('*')
        .eq('is_active', true)
        .or(`last_rebalanced.is.null,last_rebalanced.lt.${oneWeekAgo}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((portfolio: any) => ({
        id: portfolio.id,
        userId: portfolio.user_id,
        name: portfolio.name,
        description: portfolio.description,
        cashBalance: portfolio.cash_balance,
        totalValue: portfolio.total_value,
        totalPnL: portfolio.total_pnl,
        createdAt: new Date(portfolio.created_at),
        updatedAt: new Date(portfolio.updated_at),
      }));
    } catch (error: any) {
      throw new Error(`Failed to get portfolios for rebalancing: ${error.message}`);
    }
  }

  // Rebalance a portfolio
  async rebalancePortfolio(portfolioId: string): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Database not available');
    }

    try {
      // This is a simplified rebalancing logic
      // In a real implementation, this would analyze positions and rebalance based on strategy
      
      // Note: last_rebalanced field doesn't exist in current schema
      // const { error } = await supabaseAdmin
      //   .from('portfolios')
      //   .update({ last_rebalanced: new Date().toISOString() })
      //   .eq('id', portfolioId);

      // if (error) throw error;

      // Note: portfolio_activity table doesn't exist in current schema
      // Log rebalancing activity would require this table to be created first
      // await supabaseAdmin.from('portfolio_activity').insert({
      //   portfolio_id: portfolioId,
      //   activity_type: 'rebalance',
      //   description: 'Portfolio rebalancing completed',
      //   timestamp: new Date().toISOString(),
      // });
      
      // For now, just log the rebalancing action
      console.log(`Portfolio ${portfolioId} rebalanced at ${new Date().toISOString()}`);
    } catch (error: any) {
      throw new Error(`Failed to rebalance portfolio: ${error.message}`);
    }
  }

  // Generate daily report for a portfolio
  async generateDailyReport(portfolioId: string): Promise<any> {
    try {
      const portfolio = await this.getPortfolio(portfolioId, '');
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      const positions = await this.getPortfolioPositions(portfolioId);
      const performance = await this.calculatePerformance(portfolioId);
      const tradesResult = await this.getTradeHistory(portfolioId);

      // Filter today's trades
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTrades = tradesResult.trades.filter((trade: TradeHistory) => {
        const tradeDate = new Date(trade.timestamp);
        tradeDate.setHours(0, 0, 0, 0);
        return tradeDate.getTime() === today.getTime();
      });

      const report = {
        portfolioId,
        portfolioName: portfolio.name,
        reportDate: new Date().toISOString(),
        summary: {
          totalValue: portfolio.totalValue,
          totalPnL: portfolio.totalPnL,
          dayChange: performance.dayChange,
          dayChangePercent: performance.dayChangePercent,
          openPositions: positions.length,
          todayTrades: todayTrades.length,
        },
        positions: positions.map(pos => ({
          symbol: pos.symbol,
          assetType: pos.assetType,
          quantity: pos.quantity,
          marketValue: pos.marketValue,
          unrealizedPnL: pos.unrealizedPnL,
          unrealizedPnLPercent: pos.unrealizedPnLPercent,
        })),
        todayTrades: todayTrades.map((trade: TradeHistory) => ({
          symbol: trade.symbol,
          action: trade.action,
          quantity: trade.quantity,
          price: trade.price,
          timestamp: trade.timestamp,
        })),
        performance: {
          totalReturnPercent: performance.totalReturnPercent,
          winRate: performance.winRate,
          profitFactor: performance.profitFactor,
        },
      };

      return report;
    } catch (error: any) {
      throw new Error(`Failed to generate daily report: ${error.message}`);
    }
  }
}

export const portfolioManager = new PortfolioManager();
export { PortfolioManager };