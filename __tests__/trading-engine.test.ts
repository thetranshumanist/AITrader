import { TradingEngine } from '../lib/trading-engine';
import { alpacaService } from '../lib/alpaca';
import { geminiService } from '../lib/gemini';
import { supabaseAdmin } from '../lib/supabase';

// Mock dependencies
jest.mock('../lib/alpaca');
jest.mock('../lib/gemini');
jest.mock('../lib/supabase');
jest.mock('../lib/monitoring');

const mockAlpacaService = alpacaService as jest.Mocked<typeof alpacaService>;
const mockGeminiService = geminiService as jest.Mocked<typeof geminiService>;
const mockSupabase = supabaseAdmin as any;

describe('TradingEngine', () => {
  let tradingEngine: TradingEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    tradingEngine = new TradingEngine();
    
    // Setup default mocks
    mockSupabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      update: jest.fn().mockResolvedValue({ data: {}, error: null }),
    });
  });

  describe('Trade Validation', () => {
    it('should validate required trade parameters', async () => {
      const invalidTrade = {
        symbol: '',
        assetType: 'stock' as const,
        action: 'buy' as const,
        quantity: 0,
        orderType: 'market' as const,
        userId: 'user123',
        portfolioId: 'portfolio123',
      };

      const result = await tradingEngine.executeTrade(invalidTrade);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation failed');
    });

    it('should validate positive quantity', async () => {
      const invalidTrade = {
        symbol: 'AAPL',
        assetType: 'stock' as const,
        action: 'buy' as const,
        quantity: -10,
        orderType: 'market' as const,
        userId: 'user123',
        portfolioId: 'portfolio123',
      };

      const result = await tradingEngine.executeTrade(invalidTrade);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation failed');
    });

    it('should require price for limit orders', async () => {
      const invalidTrade = {
        symbol: 'AAPL',
        assetType: 'stock' as const,
        action: 'buy' as const,
        quantity: 10,
        orderType: 'limit' as const,
        userId: 'user123',
        portfolioId: 'portfolio123',
      };

      const result = await tradingEngine.executeTrade(invalidTrade);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation failed');
    });
  });

  describe('Stock Trading', () => {
    it('should execute valid stock trade through Alpaca', async () => {
      const mockOrder = {
        id: 'order123',
        symbol: 'AAPL',
        qty: 10,
        side: 'buy' as const,
        type: 'market' as const,
        timeInForce: 'day' as const,
        status: 'filled',
        filledQty: 10,
        filledAvgPrice: 150.50,
        submittedAt: new Date(),
      };

      mockAlpacaService.placeOrder.mockResolvedValue(mockOrder);
      
      // Mock portfolio and risk checks
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { cash_balance: 10000, total_value: 50000 },
              error: null,
            }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn().mockResolvedValue({ error: null }),
      });

      const validTrade = {
        symbol: 'AAPL',
        assetType: 'stock' as const,
        action: 'buy' as const,
        quantity: 10,
        orderType: 'market' as const,
        userId: 'user123',
        portfolioId: 'portfolio123',
      };

      const result = await tradingEngine.executeTrade(validTrade);
      
      expect(result.success).toBe(true);
      expect(result.orderId).toBe('order123');
      expect(result.executedPrice).toBe(150.50);
      expect(result.executedQuantity).toBe(10);
      expect(mockAlpacaService.placeOrder).toHaveBeenCalledWith({
        symbol: 'AAPL',
        qty: 10,
        side: 'buy',
        type: 'market',
        timeInForce: 'day',
      });
    });

    it('should handle Alpaca API errors gracefully', async () => {
      mockAlpacaService.placeOrder.mockRejectedValue(new Error('Insufficient funds'));
      
      // Mock successful validation and risk checks
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { cash_balance: 10000, total_value: 50000 },
              error: null,
            }),
          }),
        }),
      });

      const validTrade = {
        symbol: 'AAPL',
        assetType: 'stock' as const,
        action: 'buy' as const,
        quantity: 10,
        orderType: 'market' as const,
        userId: 'user123',
        portfolioId: 'portfolio123',
      };

      const result = await tradingEngine.executeTrade(validTrade);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient funds');
    });
  });

  describe('Crypto Trading', () => {
    it('should execute valid crypto trade through Gemini', async () => {
      const mockOrder = {
        orderId: 'crypto-order123',
        symbol: 'BTCUSD',
        side: 'buy' as const,
        type: 'market' as const,
        amount: 0.1,
        price: 45000,
        remainingAmount: 0,
        executedAmount: 0.1,
        avgExecutionPrice: 45000,
        timestamp: new Date(),
        status: 'filled' as const,
        isLive: false,
        isCancelled: false,
      };

      mockGeminiService.isConfigured.mockReturnValue(true);
      mockGeminiService.placeOrder.mockResolvedValue(mockOrder);
      
      // Mock portfolio and risk checks
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { cash_balance: 10000, total_value: 50000 },
              error: null,
            }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn().mockResolvedValue({ error: null }),
      });

      const validTrade = {
        symbol: 'BTCUSD',
        assetType: 'crypto' as const,
        action: 'buy' as const,
        quantity: 0.1,
        orderType: 'market' as const,
        userId: 'user123',
        portfolioId: 'portfolio123',
      };

      const result = await tradingEngine.executeTrade(validTrade);
      
      expect(result.success).toBe(true);
      expect(result.orderId).toBe('crypto-order123');
      expect(result.executedPrice).toBe(45000);
      expect(result.executedQuantity).toBe(0.1);
      expect(mockGeminiService.placeOrder).toHaveBeenCalled();
    });

    it('should fail when Gemini is not configured', async () => {
      mockGeminiService.isConfigured.mockReturnValue(false);
      
      // Mock successful validation and risk checks
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { cash_balance: 10000, total_value: 50000 },
              error: null,
            }),
          }),
        }),
      });

      const validTrade = {
        symbol: 'BTCUSD',
        assetType: 'crypto' as const,
        action: 'buy' as const,
        quantity: 0.1,
        orderType: 'market' as const,
        userId: 'user123',
        portfolioId: 'portfolio123',
      };

      const result = await tradingEngine.executeTrade(validTrade);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Gemini API not configured');
    });
  });

  describe('Risk Management', () => {
    it('should prevent trades that exceed maximum position size', async () => {
      // Mock portfolio with large position that would exceed limits
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { 
                cash_balance: 1000, // Low cash
                total_value: 10000, // Total portfolio value
              },
              error: null,
            }),
          }),
        }),
      });

      const riskyTrade = {
        symbol: 'AAPL',
        assetType: 'stock' as const,
        action: 'buy' as const,
        quantity: 100, // Large quantity
        price: 150,
        orderType: 'limit' as const,
        userId: 'user123',
        portfolioId: 'portfolio123',
      };

      const result = await tradingEngine.executeTrade(riskyTrade);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Risk management violation');
    });
  });

  describe('Portfolio Updates', () => {
    it('should update portfolio after successful trade', async () => {
      const mockOrder = {
        id: 'order123',
        symbol: 'AAPL',
        qty: 10,
        side: 'buy' as const,
        type: 'market' as const,
        timeInForce: 'day' as const,
        status: 'filled',
        filledQty: 10,
        filledAvgPrice: 150.50,
        submittedAt: new Date(),
      };

      mockAlpacaService.placeOrder.mockResolvedValue(mockOrder);
      
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockResolvedValue({ error: null });
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { cash_balance: 10000, total_value: 50000 },
              error: null,
            }),
          }),
        }),
        insert: mockInsert,
        update: mockUpdate,
      });

      const validTrade = {
        symbol: 'AAPL',
        assetType: 'stock' as const,
        action: 'buy' as const,
        quantity: 10,
        orderType: 'market' as const,
        userId: 'user123',
        portfolioId: 'portfolio123',
      };

      const result = await tradingEngine.executeTrade(validTrade);
      
      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalled(); // Trade logged
      expect(mockUpdate).toHaveBeenCalled(); // Portfolio updated
    });
  });
});