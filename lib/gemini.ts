// Import crypto conditionally for Node.js environment
let crypto: any;
if (typeof window === 'undefined') {
  // Server-side - use dynamic import for Node.js crypto
  crypto = eval('require')('crypto');
} else {
  // Client-side - use Web Crypto API or throw error
  crypto = {
    createHmac: () => {
      throw new Error('Gemini API operations must be performed server-side');
    }
  };
}

// Types for Gemini data structures
export interface GeminiConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  sandbox: boolean;
}

export interface CryptoTicker {
  symbol: string;
  price: number;
  volume: number;
  timestamp: Date;
  high24h: number;
  low24h: number;
  change24h: number;
  changePercent24h: number;
  bid: number;
  ask: number;
}

export interface CryptoCandle {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface GeminiOrder {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: string;
  amount: number;
  price: number;
  avgExecutionPrice: number;
  executedAmount: number;
  remainingAmount: number;
  isLive: boolean;
  isCancelled: boolean;
  timestamp: Date;
}

export interface GeminiBalance {
  currency: string;
  amount: number;
  available: number;
  availableForWithdrawal: number;
  type: string;
}

class GeminiService {
  private config: GeminiConfig;
  private rateLimitTracker: Map<string, number[]> = new Map();

  constructor() {
    this.config = {
      apiKey: process.env.GEMINI_API_KEY!,
      secretKey: process.env.GEMINI_SECRET_KEY!,
      baseUrl: process.env.NODE_ENV === 'production' 
        ? 'https://api.gemini.com'
        : 'https://api.sandbox.gemini.com',
      sandbox: process.env.NODE_ENV !== 'production',
    };

    if (!this.config.apiKey || !this.config.secretKey) {
      console.warn('Gemini API credentials not provided, crypto trading will be disabled');
    }
  }

  // Rate limiting helper
  private async checkRateLimit(endpoint: string): Promise<void> {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 120; // 120 requests per minute for public API

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

  // Create HMAC signature for authenticated requests
  private createSignature(payload: string): string {
    if (!this.config.secretKey) {
      throw new Error('Gemini secret key not configured');
    }
    
    return crypto
      .createHmac('sha384', Buffer.from(this.config.secretKey, 'base64'))
      .update(payload)
      .digest('hex');
  }

  // Make authenticated request
  private async makeAuthenticatedRequest(
    endpoint: string,
    payload: any = {}
  ): Promise<any> {
    if (!this.config.apiKey || !this.config.secretKey) {
      throw new Error('Gemini API credentials not configured');
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    const nonce = Date.now().toString();
    
    const requestPayload = {
      request: endpoint,
      nonce,
      ...payload,
    };

    const encodedPayload = Buffer.from(JSON.stringify(requestPayload)).toString('base64');
    const signature = this.createSignature(encodedPayload);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Content-Length': '0',
        'X-GEMINI-APIKEY': this.config.apiKey,
        'X-GEMINI-PAYLOAD': encodedPayload,
        'X-GEMINI-SIGNATURE': signature,
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  // Make public request
  private async makePublicRequest(endpoint: string): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${error}`);
    }

    return response.json();
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
        if (error.message.includes('401') || error.message.includes('403')) {
          throw error;
        }

        // Don't retry on validation errors
        if (error.message.includes('400')) {
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

  // Get available symbols
  async getSymbols(): Promise<string[]> {
    await this.checkRateLimit('symbols');
    
    return this.executeWithRetry(async () => {
      return await this.makePublicRequest('/v1/symbols');
    });
  }

  // Get ticker data for a symbol
  async getTicker(symbol: string): Promise<CryptoTicker> {
    await this.checkRateLimit('ticker');
    
    return this.executeWithRetry(async () => {
      const data = await this.makePublicRequest(`/v2/ticker/${symbol}`);
      
      return {
        symbol,
        price: parseFloat(data.close),
        volume: parseFloat(data.volume),
        timestamp: new Date(),
        high24h: parseFloat(data.high),
        low24h: parseFloat(data.low),
        change24h: parseFloat(data.changes[0]),
        changePercent24h: (parseFloat(data.changes[0]) / parseFloat(data.open)) * 100,
        bid: parseFloat(data.bid),
        ask: parseFloat(data.ask),
      };
    });
  }

  // Get ticker data for multiple symbols
  async getTickers(symbols: string[]): Promise<CryptoTicker[]> {
    const tickers: CryptoTicker[] = [];
    
    for (const symbol of symbols) {
      try {
        const ticker = await this.getTicker(symbol);
        tickers.push(ticker);
      } catch (error) {
        console.warn(`Failed to fetch ticker for ${symbol}:`, error);
      }
    }
    
    return tickers;
  }

  // Get historical candle data
  async getCandles(
    symbol: string,
    timeFrame: '1m' | '5m' | '15m' | '30m' | '1hr' | '6hr' | '1day'
  ): Promise<CryptoCandle[]> {
    await this.checkRateLimit('candles');
    
    return this.executeWithRetry(async () => {
      const data = await this.makePublicRequest(`/v2/candles/${symbol}/${timeFrame}`);
      
      return data.map((candle: any) => ({
        symbol,
        timestamp: new Date(candle[0]),
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
      }));
    });
  }

  // Get account balances
  async getBalances(): Promise<GeminiBalance[]> {
    await this.checkRateLimit('balances');
    
    return this.executeWithRetry(async () => {
      const data = await this.makeAuthenticatedRequest('/v1/balances');
      
      return data.map((balance: any) => ({
        currency: balance.currency,
        amount: parseFloat(balance.amount),
        available: parseFloat(balance.available),
        availableForWithdrawal: parseFloat(balance.availableForWithdrawal),
        type: balance.type,
      }));
    });
  }

  // Place an order
  async placeOrder(params: {
    symbol: string;
    amount: number;
    price?: number;
    side: 'buy' | 'sell';
    type: 'exchange limit' | 'market buy' | 'market sell';
  }): Promise<GeminiOrder> {
    await this.checkRateLimit('orders');
    
    return this.executeWithRetry(async () => {
      const orderParams: any = {
        symbol: params.symbol,
        amount: params.amount.toString(),
        side: params.side,
        type: params.type,
      };

      if (params.price) {
        orderParams.price = params.price.toString();
      }

      const data = await this.makeAuthenticatedRequest('/v1/order/new', orderParams);
      
      return {
        orderId: data.order_id,
        symbol: data.symbol,
        side: data.side,
        type: data.type,
        amount: parseFloat(data.amount),
        price: parseFloat(data.price),
        avgExecutionPrice: parseFloat(data.avg_execution_price),
        executedAmount: parseFloat(data.executed_amount),
        remainingAmount: parseFloat(data.remaining_amount),
        isLive: data.is_live,
        isCancelled: data.is_cancelled,
        timestamp: new Date(data.timestamp),
      };
    });
  }

  // Get order status
  async getOrder(orderId: string): Promise<GeminiOrder> {
    await this.checkRateLimit('orders');
    
    return this.executeWithRetry(async () => {
      const data = await this.makeAuthenticatedRequest('/v1/order/status', {
        order_id: orderId,
      });
      
      return {
        orderId: data.order_id,
        symbol: data.symbol,
        side: data.side,
        type: data.type,
        amount: parseFloat(data.amount),
        price: parseFloat(data.price),
        avgExecutionPrice: parseFloat(data.avg_execution_price),
        executedAmount: parseFloat(data.executed_amount),
        remainingAmount: parseFloat(data.remaining_amount),
        isLive: data.is_live,
        isCancelled: data.is_cancelled,
        timestamp: new Date(data.timestamp),
      };
    });
  }

  // Get active orders
  async getActiveOrders(): Promise<GeminiOrder[]> {
    await this.checkRateLimit('orders');
    
    return this.executeWithRetry(async () => {
      const data = await this.makeAuthenticatedRequest('/v1/orders');
      
      return data.map((order: any) => ({
        orderId: order.order_id,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        amount: parseFloat(order.amount),
        price: parseFloat(order.price),
        avgExecutionPrice: parseFloat(order.avg_execution_price),
        executedAmount: parseFloat(order.executed_amount),
        remainingAmount: parseFloat(order.remaining_amount),
        isLive: order.is_live,
        isCancelled: order.is_cancelled,
        timestamp: new Date(order.timestamp),
      }));
    });
  }

  // Cancel order
  async cancelOrder(orderId: string): Promise<GeminiOrder> {
    await this.checkRateLimit('orders');
    
    return this.executeWithRetry(async () => {
      const data = await this.makeAuthenticatedRequest('/v1/order/cancel', {
        order_id: orderId,
      });
      
      return {
        orderId: data.order_id,
        symbol: data.symbol,
        side: data.side,
        type: data.type,
        amount: parseFloat(data.amount),
        price: parseFloat(data.price),
        avgExecutionPrice: parseFloat(data.avg_execution_price),
        executedAmount: parseFloat(data.executed_amount),
        remainingAmount: parseFloat(data.remaining_amount),
        isLive: data.is_live,
        isCancelled: data.is_cancelled,
        timestamp: new Date(data.timestamp),
      };
    });
  }

  // Cancel all orders
  async cancelAllOrders(): Promise<void> {
    await this.checkRateLimit('orders');
    
    return this.executeWithRetry(async () => {
      await this.makeAuthenticatedRequest('/v1/order/cancel/all');
    });
  }

  // Get trade history
  async getTradeHistory(symbol?: string, limit = 50): Promise<any[]> {
    await this.checkRateLimit('trades');
    
    return this.executeWithRetry(async () => {
      const params: any = { limit_trades: limit };
      if (symbol) {
        params.symbol = symbol;
      }
      
      return await this.makeAuthenticatedRequest('/v1/mytrades', params);
    });
  }

  // Validate order parameters
  validateOrder(params: {
    symbol: string;
    amount: number;
    price?: number;
    side: 'buy' | 'sell';
    type: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.symbol || params.symbol.length === 0) {
      errors.push('Symbol is required');
    }

    if (!params.amount || params.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!['buy', 'sell'].includes(params.side)) {
      errors.push('Side must be buy or sell');
    }

    if (params.type === 'exchange limit' && !params.price) {
      errors.push('Price is required for limit orders');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Check if API is configured
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.secretKey);
  }
}

// Export singleton instance
export const geminiService = new GeminiService();

// Export types and service class
export { GeminiService };