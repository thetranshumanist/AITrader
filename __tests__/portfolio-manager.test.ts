import { portfolioManager } from '../lib/portfolio-manager';
import { alpacaService } from '../lib/alpaca';
import { geminiService } from '../lib/gemini';
import { supabaseAdmin } from '../lib/supabase';

// Mock dependencies
jest.mock('../lib/alpaca');
jest.mock('../lib/gemini');
jest.mock('../lib/supabase');

const mockSupabase = supabaseAdmin as any;
const mockAlpacaService = alpacaService as jest.Mocked<typeof alpacaService>;
const mockGeminiService = geminiService as jest.Mocked<typeof geminiService>;

describe('PortfolioManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default Supabase mock with dynamic responses
    const mockInsert = jest.fn().mockImplementation((data) => {
      const portfolioData = Array.isArray(data) ? data[0] : data;
      return {
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'portfolio123',
              user_id: portfolioData.user_id,
              name: portfolioData.name,
              description: portfolioData.description,
              cash_balance: portfolioData.cash_balance || 100000,
              total_value: portfolioData.cash_balance || 100000,
              total_pnl: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      };
    });
    
    mockSupabase.from = jest.fn().mockReturnValue({
      insert: mockInsert,
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            data: [],
            error: null,
          }),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
        gt: jest.fn().mockReturnValue({
          data: [],
          error: null,
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });
    
    // Setup Gemini service mock
    mockGeminiService.isConfigured.mockReturnValue(true);
    mockGeminiService.getTicker.mockImplementation(async (symbol: string) => {
      if (symbol === 'BTCUSD') {
        return {
          symbol: 'BTCUSD',
          price: 46000,
          volume: 1000000,
          timestamp: new Date(),
          high24h: 47000,
          low24h: 45000,
          change24h: 1000,
          changePercent24h: 2.17,
          bid: 45900,
          ask: 46100,
        };
      }
      throw new Error(`No mock data for symbol: ${symbol}`);
    });
  });

  describe('Portfolio Creation', () => {
    it('should create a new portfolio with default values', async () => {
      const portfolio = await portfolioManager.createPortfolio(
        'user123',
        'My Trading Portfolio',
        50000,
        'A portfolio for trading stocks'
      );

      expect(portfolio).toEqual({
        id: 'portfolio123',
        userId: 'user123',
        name: 'My Trading Portfolio',
        description: 'A portfolio for trading stocks',
        cashBalance: 50000, // The actual parameter passed
        totalValue: 50000,
        totalPnL: 0,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('portfolios');
    });

    it('should handle database errors during creation', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      });

      await expect(
        portfolioManager.createPortfolio('user123', 'Test Portfolio')
      ).rejects.toThrow('Failed to create portfolio');
    });

    it('should create portfolio with minimum parameters', async () => {
      const portfolio = await portfolioManager.createPortfolio(
        'user123',
        'Minimal Portfolio'
      );

      expect(portfolio.name).toBe('Minimal Portfolio');
      expect(portfolio.userId).toBe('user123');
      expect(portfolio.cashBalance).toBe(100000); // Default from mock
    });
  });

  describe('Portfolio Retrieval', () => {
    it('should get user portfolios', async () => {
      const mockPortfolios = [
        {
          id: 'portfolio1',
          user_id: 'user123',
          name: 'Portfolio 1',
          cash_balance: 50000,
          total_value: 55000,
          total_pnl: 5000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'portfolio2',
          user_id: 'user123',
          name: 'Portfolio 2',
          cash_balance: 30000,
          total_value: 28000,
          total_pnl: -2000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockPortfolios,
              error: null,
            }),
          }),
        }),
      });

      const portfolios = await portfolioManager.getUserPortfolios('user123');

      expect(portfolios).toHaveLength(2);
      expect(portfolios[0].name).toBe('Portfolio 1');
      expect(portfolios[0].totalPnL).toBe(5000);
      expect(portfolios[1].name).toBe('Portfolio 2');
      expect(portfolios[1].totalPnL).toBe(-2000);
    });

    it('should get specific portfolio by ID', async () => {
      const mockPortfolio = {
        id: 'portfolio123',
        user_id: 'user123',
        name: 'Test Portfolio',
        description: 'Test description',
        cash_balance: 75000,
        total_value: 80000,
        total_pnl: 5000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockPortfolio,
                error: null,
              }),
            }),
          }),
        }),
      });

      const portfolio = await portfolioManager.getPortfolio('portfolio123', 'user123');

      expect(portfolio).not.toBeNull();
      expect(portfolio!.name).toBe('Test Portfolio');
      expect(portfolio!.description).toBe('Test description');
      expect(portfolio!.cashBalance).toBe(75000);
    });

    it('should return null for non-existent portfolio', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }, // Not found
              }),
            }),
          }),
        }),
      });

      const portfolio = await portfolioManager.getPortfolio('nonexistent', 'user123');

      expect(portfolio).toBeNull();
    });
  });

  describe('Portfolio Positions', () => {
    it('should get portfolio positions with current prices', async () => {
      const mockPositions = [
        {
          id: 'pos1',
          portfolio_id: 'portfolio123',
          symbol: 'AAPL',
          asset_type: 'stock',
          quantity: 10,
          average_price: 150,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'pos2',
          portfolio_id: 'portfolio123',
          symbol: 'BTCUSD',
          asset_type: 'crypto',
          quantity: 0.5,
          average_price: 45000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockResolvedValue({
              data: mockPositions,
              error: null,
            }),
          }),
        }),
      });

      // Mock current prices  
      mockAlpacaService.getLatestQuote.mockResolvedValue({
        symbol: 'AAPL',
        bidPrice: 152,
        bidSize: 100,
        askPrice: 153,
        askSize: 100,
        timestamp: new Date(),
      });

      const positions = await portfolioManager.getPortfolioPositions('portfolio123');

      expect(positions).toHaveLength(2);
      
      // Check stock position
      const stockPosition = positions.find(p => p.symbol === 'AAPL');
      expect(stockPosition).toBeDefined();
      expect(stockPosition!.quantity).toBe(10);
      expect(stockPosition!.averagePrice).toBe(150);
      expect(stockPosition!.currentPrice).toBe(152.5); // Mid price (bid + ask) / 2
      expect(stockPosition!.marketValue).toBe(1525); // 10 * 152.5
      expect(stockPosition!.unrealizedPnL).toBe(25); // (152.5 - 150) * 10
      
      // Check crypto position
      const cryptoPosition = positions.find(p => p.symbol === 'BTCUSD');
      expect(cryptoPosition).toBeDefined();
      expect(cryptoPosition!.quantity).toBe(0.5);
      expect(cryptoPosition!.averagePrice).toBe(45000);
      expect(cryptoPosition!.currentPrice).toBe(46000);
    });
  });

  describe('Portfolio Performance', () => {
    it('should calculate portfolio performance metrics', async () => {
      const mockPortfolio = {
        id: 'portfolio123',
        user_id: 'user123',
        cash_balance: 50000,
        total_value: 75000,
        total_pnl: 5000,
      };

      const mockTrades = [
        {
          realized_pnl: 100,
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        },
        {
          realized_pnl: 200,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        },
        {
          realized_pnl: -50,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'portfolios') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockPortfolio,
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
                order: jest.fn().mockResolvedValue({
                  data: mockTrades,
                  error: null,
                }),
              }),
            }),
          };
        }
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
      });

      const performance = await portfolioManager.calculatePerformance('portfolio123');

      expect(performance.portfolioId).toBe('portfolio123');
      expect(performance.totalValue).toBeGreaterThan(0);
      expect(performance.winRate).toBeGreaterThanOrEqual(0);
      expect(performance.winRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Portfolio Deletion', () => {
    it('should delete portfolio successfully', async () => {
      await portfolioManager.deletePortfolio('portfolio123', 'user123');

      expect(mockSupabase.from).toHaveBeenCalledWith('portfolios');
      expect(mockSupabase.from().delete).toHaveBeenCalled();
      expect(mockSupabase.from().delete().eq).toHaveBeenCalledWith('id', 'portfolio123');
    });

    it('should handle deletion errors', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: { message: 'Permission denied' },
            }),
          }),
        }),
      });

      await expect(
        portfolioManager.deletePortfolio('portfolio123', 'user123')
      ).rejects.toThrow('Failed to delete portfolio');
    });
  });

  describe('Brokerage Sync', () => {
    it('should sync positions from Alpaca and Gemini', async () => {
      const mockAlpacaPositions = [
        {
          symbol: 'AAPL',
          qty: 10,
          avg_cost: 150,
        },
        {
          symbol: 'GOOGL',
          qty: 5,
          avg_cost: 2500,
        },
      ];

      const mockGeminiBalances = [
        {
          currency: 'BTC',
          amount: 0.5,
          available: 0.5,
          availableForWithdrawal: 0.5,
          type: 'exchange',
        },
        {
          currency: 'ETH',
          amount: 2.0,
          available: 2.0,
          availableForWithdrawal: 2.0,
          type: 'exchange',
        },
        {
          currency: 'USD',
          amount: 1000,
          available: 1000,
          availableForWithdrawal: 1000,
          type: 'exchange',
        },
      ];

      mockAlpacaService.getPositions.mockResolvedValue(mockAlpacaPositions as any);
      mockGeminiService.isConfigured.mockReturnValue(true);
      mockGeminiService.getBalances.mockResolvedValue(mockGeminiBalances);
      
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await portfolioManager.syncWithBrokerageAccounts('portfolio123');

      expect(result.stocksSynced).toBe(2);
      expect(result.cryptoSynced).toBe(2); // BTC and ETH, not USD
      expect(result.errors).toHaveLength(0);
      expect(mockAlpacaService.getPositions).toHaveBeenCalled();
      expect(mockGeminiService.getBalances).toHaveBeenCalled();
    });

    it('should handle sync errors gracefully', async () => {
      mockAlpacaService.getPositions.mockRejectedValue(new Error('API rate limit'));
      mockGeminiService.isConfigured.mockReturnValue(false);

      const result = await portfolioManager.syncWithBrokerageAccounts('portfolio123');

      expect(result.stocksSynced).toBe(0);
      expect(result.cryptoSynced).toBe(0);
      expect(result.errors).toContain('Stock sync error: API rate limit');
    });
  });
});