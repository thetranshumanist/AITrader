// Import Alpaca conditionally for server environment
let Alpaca: any;
if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
  if (process.env.NODE_ENV === 'test') {
    // Test environment - use mock
    Alpaca = class MockAlpaca {
      constructor() {
        // Mock constructor for tests
      }
      
      getAccount() {
        return Promise.resolve({
          id: 'test-account',
          account_number: 'TEST123',
          status: 'ACTIVE',
          currency: 'USD',
          buying_power: '50000',
          cash: '25000',
          portfolio_value: '75000',
          equity: '75000',
          long_market_value: '50000',
          short_market_value: '0',
          daytrade_count: 0,
          daytrading_buying_power: '100000',
        });
      }
      
      getPositions() {
        return Promise.resolve([]);
      }
      
      getOrders() {
        return Promise.resolve([]);
      }
      
      createOrder() {
        return Promise.resolve({
          id: 'test-order-id',
          status: 'accepted',
        });
      }
      
      cancelOrder() {
        return Promise.resolve();
      }
      
      getBars() {
        return Promise.resolve([]);
      }
      
      getLatestQuote() {
        return Promise.resolve({
          bid: 100,
          ask: 101,
          timestamp: new Date(),
        });
      }
    };
  } else {
    // Server-side - use dynamic import for Node.js modules
    Alpaca = eval('require')('@alpacahq/alpaca-trade-api');
  }
} else {
  // Client-side - operations must be performed server-side
  Alpaca = class MockAlpaca {
    constructor() {
      throw new Error('Alpaca API operations must be performed server-side');
    }
  };
}

// Types for Alpaca data structures
export interface AlpacaConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  dataUrl: string;
  paper: boolean;
}

export interface StockQuote {
  symbol: string;
  bidPrice: number;
  bidSize: number;
  askPrice: number;
  askSize: number;
  timestamp: Date;
}

export interface StockBar {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradeCount: number;
  vwap: number;
}

export interface AlpacaOrder {
  id: string;
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  timeInForce: 'day' | 'gtc' | 'ioc' | 'fok';
  limitPrice?: number;
  stopPrice?: number;
  status: string;
  filledQty: number;
  filledAvgPrice: number;
  submittedAt: Date;
  filledAt?: Date;
}

export interface AlpacaPosition {
  symbol: string;
  qty: number;
  side: 'long' | 'short';
  marketValue: number;
  costBasis: number;
  unrealizedPl: number;
  unrealizedPlpc: number;
  avgEntryPrice: number;
  currentPrice: number;
}

export interface AlpacaAccount {
  id: string;
  accountNumber: string;
  status: string;
  currency: string;
  buyingPower: number;
  cash: number;
  portfolioValue: number;
  equity: number;
  longMarketValue: number;
  shortMarketValue: number;
  daytradeCount: number;
  daytradingBuyingPower: number;
}

class AlpacaService {
  private client: any;
  private config: AlpacaConfig;
  private rateLimitTracker: Map<string, number[]> = new Map();

  constructor() {
    this.config = {
      apiKey: process.env.ALPACA_API_KEY || 'test-key',
      secretKey: process.env.ALPACA_SECRET_KEY || 'test-secret',
      baseUrl: process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets',
      dataUrl: process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets',
      paper: process.env.NODE_ENV !== 'production',
    };

    if (process.env.NODE_ENV !== 'test' && (!this.config.apiKey || !this.config.secretKey)) {
      throw new Error('Alpaca API credentials are required');
    }

    this.client = new Alpaca({
      credentials: {
        key: this.config.apiKey,
        secret: this.config.secretKey,
      },
      paper: this.config.paper,
      usePolygon: false,
    });
  }

  // Rate limiting helper
  private async checkRateLimit(endpoint: string): Promise<void> {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 200; // 200 requests per minute

    if (!this.rateLimitTracker.has(endpoint)) {
      this.rateLimitTracker.set(endpoint, []);
    }

    const requests = this.rateLimitTracker.get(endpoint)!;
    const recentRequests = requests.filter(time => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const waitTime = windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    recentRequests.push(now);
    this.rateLimitTracker.set(endpoint, recentRequests);
  }

  // Error handling wrapper
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    backoffMs = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on authentication errors
        if (error.status === 401 || error.status === 403) {
          throw error;
        }

        // Don't retry on validation errors
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff
        const delay = backoffMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // Account information
  async getAccount(): Promise<AlpacaAccount> {
    await this.checkRateLimit('account');
    
    return this.executeWithRetry(async () => {
      const account = await this.client.getAccount();
      return {
        id: account.id,
        accountNumber: account.account_number,
        status: account.status,
        currency: account.currency,
        buyingPower: parseFloat(account.buying_power),
        cash: parseFloat(account.cash),
        portfolioValue: parseFloat(account.portfolio_value),
        equity: parseFloat(account.equity),
        longMarketValue: parseFloat(account.long_market_value),
        shortMarketValue: parseFloat(account.short_market_value),
        daytradeCount: account.daytrade_count,
        daytradingBuyingPower: parseFloat(account.daytrading_buying_power),
      };
    });
  }

  // Get current positions
  async getPositions(): Promise<AlpacaPosition[]> {
    await this.checkRateLimit('positions');
    
    return this.executeWithRetry(async () => {
      const positions = await this.client.getPositions();
      return positions.map((pos: any) => ({
        symbol: pos.symbol,
        qty: parseFloat(pos.qty),
        side: parseFloat(pos.qty) > 0 ? 'long' : 'short',
        marketValue: parseFloat(pos.market_value),
        costBasis: parseFloat(pos.cost_basis),
        unrealizedPl: parseFloat(pos.unrealized_pl),
        unrealizedPlpc: parseFloat(pos.unrealized_plpc),
        avgEntryPrice: parseFloat(pos.avg_entry_price),
        currentPrice: parseFloat(pos.current_price),
      }));
    });
  }

  // Get latest quote for a symbol
  async getLatestQuote(symbol: string): Promise<StockQuote> {
    await this.checkRateLimit('quotes');
    
    return this.executeWithRetry(async () => {
      const quote = await this.client.getLatestQuote(symbol);
      return {
        symbol,
        bidPrice: quote.bidprice,
        bidSize: quote.bidsize,
        askPrice: quote.askprice,
        askSize: quote.asksize,
        timestamp: new Date(quote.timestamp),
      };
    });
  }

  // Get latest quotes for multiple symbols
  async getLatestQuotes(symbols: string[]): Promise<StockQuote[]> {
    await this.checkRateLimit('quotes');
    
    return this.executeWithRetry(async () => {
      const quotes = await this.client.getLatestQuotes(symbols);
      return Object.entries(quotes).map(([symbol, quote]: [string, any]) => ({
        symbol,
        bidPrice: quote.bidprice,
        bidSize: quote.bidsize,
        askPrice: quote.askprice,
        askSize: quote.asksize,
        timestamp: new Date(quote.timestamp),
      }));
    });
  }

  // Get historical bars
  async getHistoricalBars(
    symbol: string,
    timeframe: '1Min' | '5Min' | '15Min' | '1Hour' | '1Day',
    start: Date,
    end: Date,
    limit = 1000
  ): Promise<StockBar[]> {
    await this.checkRateLimit('bars');
    
    return this.executeWithRetry(async () => {
      const bars = await this.client.getBarsV2(symbol, {
        start: start.toISOString(),
        end: end.toISOString(),
        timeframe,
        limit,
      });

      return bars.map((bar: any) => ({
        symbol,
        timestamp: new Date(bar.Timestamp),
        open: bar.OpenPrice,
        high: bar.HighPrice,
        low: bar.LowPrice,
        close: bar.ClosePrice,
        volume: bar.Volume,
        tradeCount: bar.TradeCount,
        vwap: bar.VWAP,
      }));
    });
  }

  // Place an order
  async placeOrder(orderParams: {
    symbol: string;
    qty: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit' | 'stop' | 'stop_limit';
    timeInForce?: 'day' | 'gtc' | 'ioc' | 'fok';
    limitPrice?: number;
    stopPrice?: number;
  }): Promise<AlpacaOrder> {
    await this.checkRateLimit('orders');
    
    return this.executeWithRetry(async () => {
      const order = await this.client.createOrder({
        symbol: orderParams.symbol,
        qty: orderParams.qty,
        side: orderParams.side,
        type: orderParams.type,
        time_in_force: orderParams.timeInForce || 'day',
        limit_price: orderParams.limitPrice,
        stop_price: orderParams.stopPrice,
      });

      return {
        id: order.id,
        symbol: order.symbol,
        qty: parseFloat(order.qty),
        side: order.side,
        type: order.order_type,
        timeInForce: order.time_in_force,
        limitPrice: order.limit_price ? parseFloat(order.limit_price) : undefined,
        stopPrice: order.stop_price ? parseFloat(order.stop_price) : undefined,
        status: order.status,
        filledQty: parseFloat(order.filled_qty),
        filledAvgPrice: parseFloat(order.filled_avg_price || '0'),
        submittedAt: new Date(order.submitted_at),
        filledAt: order.filled_at ? new Date(order.filled_at) : undefined,
      };
    });
  }

  // Get order by ID
  async getOrder(orderId: string): Promise<AlpacaOrder> {
    await this.checkRateLimit('orders');
    
    return this.executeWithRetry(async () => {
      const order = await this.client.getOrder(orderId);
      return {
        id: order.id,
        symbol: order.symbol,
        qty: parseFloat(order.qty),
        side: order.side,
        type: order.order_type,
        timeInForce: order.time_in_force,
        limitPrice: order.limit_price ? parseFloat(order.limit_price) : undefined,
        stopPrice: order.stop_price ? parseFloat(order.stop_price) : undefined,
        status: order.status,
        filledQty: parseFloat(order.filled_qty),
        filledAvgPrice: parseFloat(order.filled_avg_price || '0'),
        submittedAt: new Date(order.submitted_at),
        filledAt: order.filled_at ? new Date(order.filled_at) : undefined,
      };
    });
  }

  // Get all orders
  async getOrders(params?: {
    status?: 'open' | 'closed' | 'all';
    limit?: number;
    after?: Date;
    until?: Date;
  }): Promise<AlpacaOrder[]> {
    await this.checkRateLimit('orders');
    
    return this.executeWithRetry(async () => {
      const orders = await this.client.getOrders({
        status: params?.status || 'all',
        limit: params?.limit || 50,
        after: params?.after?.toISOString(),
        until: params?.until?.toISOString(),
      });

      return orders.map((order: any) => ({
        id: order.id,
        symbol: order.symbol,
        qty: parseFloat(order.qty),
        side: order.side,
        type: order.order_type,
        timeInForce: order.time_in_force,
        limitPrice: order.limit_price ? parseFloat(order.limit_price) : undefined,
        stopPrice: order.stop_price ? parseFloat(order.stop_price) : undefined,
        status: order.status,
        filledQty: parseFloat(order.filled_qty),
        filledAvgPrice: parseFloat(order.filled_avg_price || '0'),
        submittedAt: new Date(order.submitted_at),
        filledAt: order.filled_at ? new Date(order.filled_at) : undefined,
      }));
    });
  }

  // Cancel order
  async cancelOrder(orderId: string): Promise<void> {
    await this.checkRateLimit('orders');
    
    return this.executeWithRetry(async () => {
      await this.client.cancelOrder(orderId);
    });
  }

  // Cancel all orders
  async cancelAllOrders(): Promise<void> {
    await this.checkRateLimit('orders');
    
    return this.executeWithRetry(async () => {
      await this.client.cancelAllOrders();
    });
  }

  // Get market calendar
  async getMarketCalendar(start?: Date, end?: Date): Promise<any[]> {
    await this.checkRateLimit('calendar');
    
    return this.executeWithRetry(async () => {
      return await this.client.getCalendar({
        start: start?.toISOString().split('T')[0],
        end: end?.toISOString().split('T')[0],
      });
    });
  }

  // Check if market is open
  async isMarketOpen(): Promise<boolean> {
    await this.checkRateLimit('clock');
    
    return this.executeWithRetry(async () => {
      const clock = await this.client.getClock();
      return clock.is_open;
    });
  }

  // Get market clock
  async getMarketClock(): Promise<{
    timestamp: Date;
    isOpen: boolean;
    nextOpen: Date;
    nextClose: Date;
  }> {
    await this.checkRateLimit('clock');
    
    return this.executeWithRetry(async () => {
      const clock = await this.client.getClock();
      return {
        timestamp: new Date(clock.timestamp),
        isOpen: clock.is_open,
        nextOpen: new Date(clock.next_open),
        nextClose: new Date(clock.next_close),
      };
    });
  }

  // Validate trading parameters
  validateOrder(params: {
    symbol: string;
    qty: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit' | 'stop' | 'stop_limit';
    limitPrice?: number;
    stopPrice?: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.symbol || params.symbol.length === 0) {
      errors.push('Symbol is required');
    }

    if (!params.qty || params.qty <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (!['buy', 'sell'].includes(params.side)) {
      errors.push('Side must be buy or sell');
    }

    if (!['market', 'limit', 'stop', 'stop_limit'].includes(params.type)) {
      errors.push('Invalid order type');
    }

    if ((params.type === 'limit' || params.type === 'stop_limit') && !params.limitPrice) {
      errors.push('Limit price is required for limit orders');
    }

    if ((params.type === 'stop' || params.type === 'stop_limit') && !params.stopPrice) {
      errors.push('Stop price is required for stop orders');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const alpacaService = new AlpacaService();

// Export types and service class
export { AlpacaService };