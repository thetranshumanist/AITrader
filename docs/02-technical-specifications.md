# AI Trader - Technical Specifications

## 1. API Integrations

### 1.1 Alpaca Markets API Integration

#### 1.1.1 Authentication
```typescript
interface AlpacaConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string; // Paper: https://paper-api.alpaca.markets, Live: https://api.alpaca.markets
  dataUrl: string; // https://data.alpaca.markets
}
```

#### 1.1.2 Rate Limits
- **Market Data**: 200 requests per minute
- **Trading**: 200 requests per minute per account
- **Account**: 200 requests per minute per account
- **Retry Strategy**: Exponential backoff with jitter

#### 1.1.3 Endpoints Used
```typescript
// Market Data
GET /v2/stocks/{symbol}/quotes/latest
GET /v2/stocks/{symbol}/bars/latest
GET /v2/stocks/quotes/latest?symbols={symbols}
GET /v2/stocks/bars?symbols={symbols}&timeframe=1Day&start={start}&end={end}

// Trading
POST /v2/orders
GET /v2/orders
GET /v2/orders/{order_id}
DELETE /v2/orders/{order_id}

// Account
GET /v2/account
GET /v2/positions
GET /v2/positions/{symbol}
```

#### 1.1.4 Data Models
```typescript
interface AlpacaQuote {
  symbol: string;
  bidPrice: number;
  bidSize: number;
  askPrice: number;
  askSize: number;
  timestamp: string;
}

interface AlpacaBar {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
  tradeCount: number;
  vwap: number;
}

interface AlpacaOrder {
  id: string;
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  timeInForce: 'day' | 'gtc' | 'ioc' | 'fok';
  limitPrice?: number;
  stopPrice?: number;
  status: 'new' | 'partially_filled' | 'filled' | 'done_for_day' | 'canceled' | 'expired' | 'replaced';
}
```

#### 1.1.5 Error Handling
```typescript
interface AlpacaError {
  code: number;
  message: string;
  details?: any;
}

// Common Error Codes
// 401: Unauthorized
// 403: Forbidden
// 404: Not Found
// 422: Unprocessable Entity
// 429: Too Many Requests
// 500: Internal Server Error
```

### 1.2 Gemini API Integration

#### 1.2.1 Authentication
```typescript
interface GeminiConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string; // Production: https://api.gemini.com, Sandbox: https://api.sandbox.gemini.com
}

// Authentication uses HMAC SHA384
function createSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha384', secret).update(payload).digest('hex');
}
```

#### 1.2.2 Rate Limits
- **Public API**: 120 requests per minute
- **Private API**: 600 requests per minute
- **WebSocket**: Connection limit applies

#### 1.2.3 Endpoints Used
```typescript
// Market Data (Public)
GET /v1/symbols
GET /v1/ticker/{symbol}
GET /v1/candles/{symbol}/{timeframe}
GET /v2/ticker/{symbol}

// Trading (Private)
POST /v1/order/new
POST /v1/order/cancel
GET /v1/orders
GET /v1/mytrades

// Account (Private)
GET /v1/balances
GET /v1/notionalvolume
```

#### 1.2.4 Data Models
```typescript
interface GeminiTicker {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  changes: number[];
  bid: number;
  ask: number;
  volume: {
    [currency: string]: number;
  };
}

interface GeminiCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface GeminiOrder {
  order_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'exchange limit' | 'market buy' | 'market sell';
  amount: string;
  price: string;
  avg_execution_price: string;
  executed_amount: string;
  remaining_amount: string;
  is_live: boolean;
  is_cancelled: boolean;
  timestamp: number;
}
```

## 2. Technical Analysis Algorithms

### 2.1 Moving Average Convergence Divergence (MACD)

#### 2.1.1 Formula
```typescript
interface MACDParams {
  fastPeriod: number; // Default: 12
  slowPeriod: number; // Default: 26
  signalPeriod: number; // Default: 9
}

interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
}

function calculateMACD(prices: number[], params: MACDParams): MACDResult[] {
  const ema12 = calculateEMA(prices, params.fastPeriod);
  const ema26 = calculateEMA(prices, params.slowPeriod);
  
  const macdLine = ema12.map((value, index) => value - ema26[index]);
  const signalLine = calculateEMA(macdLine, params.signalPeriod);
  const histogram = macdLine.map((value, index) => value - signalLine[index]);
  
  return macdLine.map((macd, index) => ({
    macd,
    signal: signalLine[index],
    histogram: histogram[index]
  }));
}
```

#### 2.1.2 Trading Signals
- **Bullish Signal**: MACD line crosses above signal line
- **Bearish Signal**: MACD line crosses below signal line
- **Momentum**: Histogram indicates momentum strength

### 2.2 Relative Strength Index (RSI)

#### 2.2.1 Formula
```typescript
interface RSIParams {
  period: number; // Default: 14
}

function calculateRSI(prices: number[], period: number = 14): number[] {
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  const avgGain = calculateSMA(gains, period);
  const avgLoss = calculateSMA(losses, period);
  
  return avgGain.map((gain, index) => {
    const rs = gain / avgLoss[index];
    return 100 - (100 / (1 + rs));
  });
}
```

#### 2.2.2 Trading Signals
- **Overbought**: RSI > 70 (potential sell signal)
- **Oversold**: RSI < 30 (potential buy signal)
- **Neutral**: 30 <= RSI <= 70

### 2.3 Stochastic Oscillator

#### 2.3.1 Formula
```typescript
interface StochasticParams {
  kPeriod: number; // Default: 14
  kSlowing: number; // Default: 3
  dPeriod: number; // Default: 3
}

interface StochasticResult {
  k: number;
  d: number;
}

function calculateStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  params: StochasticParams
): StochasticResult[] {
  const rawK: number[] = [];
  
  for (let i = params.kPeriod - 1; i < closes.length; i++) {
    const period_high = Math.max(...highs.slice(i - params.kPeriod + 1, i + 1));
    const period_low = Math.min(...lows.slice(i - params.kPeriod + 1, i + 1));
    const current_close = closes[i];
    
    rawK.push(((current_close - period_low) / (period_high - period_low)) * 100);
  }
  
  const smoothedK = calculateSMA(rawK, params.kSlowing);
  const d = calculateSMA(smoothedK, params.dPeriod);
  
  return smoothedK.map((k, index) => ({
    k,
    d: d[index]
  }));
}
```

#### 2.3.2 Trading Signals
- **Overbought**: %K > 80 (potential sell signal)
- **Oversold**: %K < 20 (potential buy signal)
- **Bullish Crossover**: %K crosses above %D
- **Bearish Crossover**: %K crosses below %D

## 3. Multi-Strategy Signal Generation

### 3.1 Signal Aggregation
```typescript
interface StrategyWeight {
  macd: number;
  rsi: number;
  stochastic: number;
  volume: number;
  trend: number;
}

interface SignalStrength {
  action: 'buy' | 'sell' | 'hold';
  confidence: number; // 0-1
  reasoning: string[];
}

function generateTradingSignal(
  indicators: TechnicalIndicators,
  weights: StrategyWeight
): SignalStrength {
  let buyScore = 0;
  let sellScore = 0;
  const reasoning: string[] = [];
  
  // MACD Analysis
  if (indicators.macd.macd > indicators.macd.signal && indicators.macd.histogram > 0) {
    buyScore += weights.macd;
    reasoning.push('MACD bullish crossover with positive histogram');
  } else if (indicators.macd.macd < indicators.macd.signal && indicators.macd.histogram < 0) {
    sellScore += weights.macd;
    reasoning.push('MACD bearish crossover with negative histogram');
  }
  
  // RSI Analysis
  if (indicators.rsi < 30) {
    buyScore += weights.rsi;
    reasoning.push(`RSI oversold at ${indicators.rsi.toFixed(2)}`);
  } else if (indicators.rsi > 70) {
    sellScore += weights.rsi;
    reasoning.push(`RSI overbought at ${indicators.rsi.toFixed(2)}`);
  }
  
  // Stochastic Analysis
  if (indicators.stochastic.k < 20 && indicators.stochastic.k > indicators.stochastic.d) {
    buyScore += weights.stochastic;
    reasoning.push('Stochastic oversold with bullish crossover');
  } else if (indicators.stochastic.k > 80 && indicators.stochastic.k < indicators.stochastic.d) {
    sellScore += weights.stochastic;
    reasoning.push('Stochastic overbought with bearish crossover');
  }
  
  const totalScore = buyScore + sellScore;
  const confidence = Math.min(totalScore, 1);
  
  if (buyScore > sellScore && confidence > 0.6) {
    return { action: 'buy', confidence, reasoning };
  } else if (sellScore > buyScore && confidence > 0.6) {
    return { action: 'sell', confidence, reasoning };
  } else {
    return { action: 'hold', confidence: 0, reasoning: ['Insufficient signal strength'] };
  }
}
```

### 3.2 Risk Management
```typescript
interface RiskParameters {
  maxPositionSize: number; // Maximum percentage of portfolio per position
  stopLossPercentage: number; // Stop loss percentage
  takeProfitRatio: number; // Take profit to stop loss ratio
  maxDailyLoss: number; // Maximum daily loss percentage
  maxDrawdown: number; // Maximum portfolio drawdown
}

function calculatePositionSize(
  portfolioValue: number,
  entryPrice: number,
  stopLossPrice: number,
  riskParams: RiskParameters
): number {
  const riskAmount = portfolioValue * (riskParams.maxPositionSize / 100);
  const riskPerShare = Math.abs(entryPrice - stopLossPrice);
  const maxShares = Math.floor(riskAmount / riskPerShare);
  
  return Math.min(maxShares, Math.floor(portfolioValue * 0.1 / entryPrice)); // Max 10% of portfolio
}
```

## 4. Trade Execution Logic

### 4.1 Order Types
```typescript
interface OrderConfig {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  type: 'market' | 'limit' | 'stop_loss' | 'take_profit';
  price?: number;
  stopPrice?: number;
  timeInForce: 'day' | 'gtc';
}

interface ExecutionResult {
  success: boolean;
  orderId?: string;
  error?: string;
  executedPrice?: number;
  executedQuantity?: number;
  fees?: number;
}
```

### 4.2 Order Execution Flow
```typescript
async function executeOrder(order: OrderConfig): Promise<ExecutionResult> {
  try {
    // Pre-execution validation
    const validation = await validateOrder(order);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Risk check
    const riskCheck = await performRiskCheck(order);
    if (!riskCheck.approved) {
      return { success: false, error: riskCheck.reason };
    }
    
    // Execute order
    const result = await submitOrder(order);
    
    // Log execution
    await logTradeExecution(order, result);
    
    return result;
  } catch (error) {
    await logError('Order execution failed', error);
    return { success: false, error: error.message };
  }
}
```

### 4.3 Portfolio Rebalancing
```typescript
interface RebalanceConfig {
  targetAllocations: Record<string, number>; // Symbol -> percentage
  toleranceBand: number; // Percentage deviation before rebalancing
  minimumTradeSize: number; // Minimum trade size in dollars
}

async function rebalancePortfolio(config: RebalanceConfig): Promise<void> {
  const currentPositions = await getCurrentPositions();
  const currentAllocations = calculateCurrentAllocations(currentPositions);
  
  const rebalanceTrades: OrderConfig[] = [];
  
  for (const [symbol, targetPercent] of Object.entries(config.targetAllocations)) {
    const currentPercent = currentAllocations[symbol] || 0;
    const deviation = Math.abs(currentPercent - targetPercent);
    
    if (deviation > config.toleranceBand) {
      const tradeAmount = calculateTradeAmount(currentPercent, targetPercent, portfolioValue);
      
      if (Math.abs(tradeAmount) > config.minimumTradeSize) {
        rebalanceTrades.push({
          symbol,
          side: tradeAmount > 0 ? 'buy' : 'sell',
          quantity: Math.abs(tradeAmount),
          type: 'market',
          timeInForce: 'day'
        });
      }
    }
  }
  
  // Execute rebalancing trades
  for (const trade of rebalanceTrades) {
    await executeOrder(trade);
  }
}
```

## 5. Data Storage and Logging

### 5.1 Database Optimization
```sql
-- Indexes for performance
CREATE INDEX CONCURRENTLY idx_stock_data_symbol_timestamp 
ON stock_data(symbol, timestamp DESC);

CREATE INDEX CONCURRENTLY idx_crypto_data_symbol_timestamp 
ON crypto_data(symbol, timestamp DESC);

CREATE INDEX CONCURRENTLY idx_trading_signals_timestamp 
ON trading_signals(timestamp DESC);

CREATE INDEX CONCURRENTLY idx_trades_portfolio_timestamp 
ON trades(portfolio_id, timestamp DESC);

-- Partitioning for large tables
CREATE TABLE stock_data_2024 PARTITION OF stock_data 
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE crypto_data_2024 PARTITION OF crypto_data 
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### 5.2 Audit Trail Structure
```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  metadata: Record<string, any>;
}

// Audit trigger function
function createAuditTrigger(tableName: string): string {
  return `
    CREATE OR REPLACE FUNCTION audit_${tableName}()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO audit_logs (
        timestamp, user_id, action, entity_type, entity_id, 
        old_value, new_value, metadata
      ) VALUES (
        NOW(), 
        COALESCE(current_setting('app.user_id', true), 'system'),
        TG_OP,
        '${tableName}',
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
        '{}'::jsonb
      );
      RETURN COALESCE(NEW, OLD);
    END;
    $$ LANGUAGE plpgsql;
  `;
}
```

## 6. Performance Optimization

### 6.1 Caching Strategy
```typescript
interface CacheConfig {
  redis: {
    host: string;
    port: number;
    password: string;
    ttl: number; // Time to live in seconds
  };
  levels: {
    marketData: number; // 30 seconds
    indicators: number; // 5 minutes
    signals: number; // 1 minute
    portfolios: number; // 1 hour
  };
}

class CacheManager {
  private redis: Redis;
  
  async getMarketData(symbol: string): Promise<any> {
    const cached = await this.redis.get(`market:${symbol}`);
    if (cached) return JSON.parse(cached);
    
    const data = await fetchMarketData(symbol);
    await this.redis.setex(`market:${symbol}`, this.config.levels.marketData, JSON.stringify(data));
    return data;
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### 6.2 Database Connection Pooling
```typescript
interface PoolConfig {
  min: number; // Minimum connections
  max: number; // Maximum connections
  acquireTimeoutMillis: number;
  idleTimeoutMillis: number;
  createTimeoutMillis: number;
}

const dbConfig: PoolConfig = {
  min: 2,
  max: 10,
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 600000,
  createTimeoutMillis: 30000
};
```

## 7. Error Handling and Recovery

### 7.1 Circuit Breaker Pattern
```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime?: Date;
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}
```

### 7.2 Retry Logic with Exponential Backoff
```typescript
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterFactor: number;
}

async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === config.maxAttempts) {
        throw lastError;
      }
      
      const delay = calculateDelay(attempt, config);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  const delayWithCap = Math.min(exponentialDelay, config.maxDelay);
  const jitter = delayWithCap * config.jitterFactor * Math.random();
  return delayWithCap + jitter;
}
```

## 8. Security Specifications

### 8.1 API Key Management
```typescript
interface SecureConfig {
  encryption: {
    algorithm: 'aes-256-gcm';
    keyDerivation: 'pbkdf2';
    iterations: 100000;
  };
  storage: {
    provider: 'vercel' | 'vault';
    rotation: boolean;
    rotationInterval: number; // days
  };
}

class SecretManager {
  async encryptSecret(secret: string, masterKey: string): Promise<string> {
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
    
    const cipher = crypto.createCipherGCM('aes-256-gcm', key, iv);
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return [salt, iv, authTag, encrypted].map(buf => buf.toString('hex')).join(':');
  }
  
  async decryptSecret(encryptedSecret: string, masterKey: string): Promise<string> {
    const [saltHex, ivHex, authTagHex, encryptedHex] = encryptedSecret.split(':');
    
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    
    const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
    
    const decipher = crypto.createDecipherGCM('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 8.2 Request Validation
```typescript
import { z } from 'zod';

const StockDataSchema = z.object({
  symbol: z.string().min(1).max(10).regex(/^[A-Z]+$/),
  timestamp: z.string().datetime(),
  price: z.number().positive(),
  volume: z.number().min(0),
});

const TradeOrderSchema = z.object({
  symbol: z.string().min(1).max(10),
  side: z.enum(['buy', 'sell']),
  quantity: z.number().positive(),
  type: z.enum(['market', 'limit', 'stop_loss']),
  price: z.number().positive().optional(),
  timeInForce: z.enum(['day', 'gtc']).default('day'),
});

function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request data', error.errors);
    }
    throw error;
  }
}
```

This technical specification provides the detailed implementation guidelines for all core components of the AI trading system, including API integrations, technical analysis algorithms, trading logic, and security measures.