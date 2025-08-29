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
    
    // Setup Alpaca service mocks for successful scenarios
    mockAlpacaService.getAccount.mockResolvedValue({
      id: 'account123',
      accountNumber: 'ACC123',
      status: 'ACTIVE',
      currency: 'USD',
      buyingPower: 50000,
      cash: 25000,
      portfolioValue: 75000,
      equity: 75000,
      longMarketValue: 50000,
      shortMarketValue: 0,
      daytradeCount: 0,
      daytradingBuyingPower: 100000,
    });
    
    // Setup Gemini service mocks
    mockGeminiService.isConfigured.mockReturnValue(true);
    
    // Setup Supabase mocks for portfolio metrics and data operations
    const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
    const mockUpdate = jest.fn().mockResolvedValue({ data: {}, error: null });
    
    mockSupabase.from = jest.fn().mockImplementation((table: string) => {
      if (table === 'portfolios') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'portfolio123',
                    user_id: 'user123',
                    cash_balance: 10000,
                    total_value: 50000,
                    total_pnl: 1000,
                  },
                  error: null,
                }),
              }),
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'portfolio123',
                  user_id: 'user123',
                  cash_balance: 10000,
                  total_value: 50000,
                  total_pnl: 1000,
                },
                error: null,
              }),
            }),
          }),
          insert: mockInsert,
          update: mockUpdate,
        };
      }
      if (table === 'positions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gt: jest.fn().mockResolvedValue({
                data: [], // No existing positions by default
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'trades') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockResolvedValue({
                data: [], // No trades today by default
                error: null,
              }),
            }),
          }),
          insert: mockInsert,
        };
      }
      // Default fallback
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: mockInsert,
        update: mockUpdate,
      };
    });
    
    // Store references for assertions
    (mockSupabase as any).mockInsert = mockInsert;
    (mockSupabase as any).mockUpdate = mockUpdate;
    
    // Add RPC mock for portfolio updates
    mockSupabase.rpc = jest.fn().mockResolvedValue({ data: null, error: null });
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
      // Mock account validation to fail
      mockAlpacaService.getAccount.mockRejectedValue(new Error('API error'));

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
      expect(result.error).toContain('Failed to validate account status');
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

      mockGeminiService.placeOrder.mockResolvedValue(mockOrder);

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
      expect(result.error).toContain('Crypto trading not configured');
    });
  });

  describe('Risk Management', () => {
    it('should prevent trades that exceed maximum position size', async () => {
      // Override default mocks to create risk scenario
      mockSupabase.from = jest.fn().mockImplementation((table: string) => {
        if (table === 'portfolios') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: 'portfolio123',
                      user_id: 'user123',
                      cash_balance: 1000,
                      total_value: 10000, // Small portfolio
                      total_pnl: 0,
                    },
                    error: null,
                  }),
                }),
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'portfolio123',
                    user_id: 'user123',
                    cash_balance: 1000,
                    total_value: 10000, // Small portfolio
                    total_pnl: 0,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'positions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gt: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'trades') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      });

      const riskyTrade = {
        symbol: 'AAPL',
        assetType: 'stock' as const,
        action: 'buy' as const,
        quantity: 100, // Large quantity
        price: 150, // $15,000 trade value vs $10,000 portfolio = 150% position size
        orderType: 'limit' as const,
        userId: 'user123',
        portfolioId: 'portfolio123',
      };

      const result = await tradingEngine.executeTrade(riskyTrade);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Position size too large');
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
      expect(mockSupabase.mockInsert).toHaveBeenCalled(); // Trade logged
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_portfolio_performance', {
        portfolio_id: 'portfolio123',
      }); // Portfolio updated
    });
  });
});