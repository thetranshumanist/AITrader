import { NextRequest } from 'next/server';
import { GET } from '../../app/api/health/route';
import { GET as SchedulerGET, POST as SchedulerPOST } from '../../app/api/admin/scheduler/route';

// Mock dependencies
jest.mock('../../lib/alpaca');
jest.mock('../../lib/gemini');
jest.mock('../../lib/supabase');
jest.mock('../../lib/scheduler');
jest.mock('../../lib/monitoring', () => ({
  trackBusinessMetric: jest.fn(),
}));
jest.mock('../../lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

import { alpacaService } from '../../lib/alpaca';
import { geminiService } from '../../lib/gemini';
import { supabaseAdmin } from '../../lib/supabase';
import { scheduler } from '../../lib/scheduler';
import { auth } from '../../lib/auth';

const mockAlpacaService = alpacaService as jest.Mocked<typeof alpacaService>;
const mockGeminiService = geminiService as jest.Mocked<typeof geminiService>;
const mockSupabase = supabaseAdmin as any;
const mockScheduler = scheduler as jest.Mocked<typeof scheduler>;
const mockAuth = auth as any;

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful auth by default for admin routes
    mockAuth.api = {
      getSession: jest.fn().mockResolvedValue({
        user: { id: 'user123', role: 'admin' },
      }),
    };
    
    // Setup scheduler mocks
    mockScheduler.getJobStatus = jest.fn().mockReturnValue({
      dailyWorkflow: {
        name: 'Daily Trading Workflow',
        status: 'active',
        lastRun: new Date('2024-01-01T06:00:00Z'),
        nextRun: new Date('2024-01-02T06:00:00Z'),
        schedule: '0 6 * * *',
        task: 'dailyWorkflow',
        enabled: true,
      },
    });
    
    // Mock scheduler as initialized
    Object.defineProperty(mockScheduler, 'isInitialized', {
      value: true,
      writable: true,
    });
    
    mockScheduler.triggerDailyWorkflow = jest.fn().mockResolvedValue(undefined);
    mockScheduler.enableJob = jest.fn();
    mockScheduler.disableJob = jest.fn();
  });

  describe('/api/health', () => {
    it('should return healthy status when all services are up', async () => {
      // Mock successful health checks
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

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

      mockGeminiService.isConfigured.mockReturnValue(true);
      mockGeminiService.getBalances.mockResolvedValue([
        { 
          currency: 'USD', 
          amount: 1000,
          available: 1000,
          availableForWithdrawal: 1000,
          type: 'exchange'
        },
        { 
          currency: 'BTC', 
          amount: 0.5,
          available: 0.5,
          availableForWithdrawal: 0.5,
          type: 'exchange'
        },
      ]);

      mockScheduler.getJobStatus.mockReturnValue({
        dailyWorkflow: {
          name: 'Daily Workflow',
          status: 'active',
          lastRun: new Date(),
          nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
          schedule: '0 6 * * *',
          task: 'dailyWorkflow',
          enabled: true,
        } as any,
      });
      
      // Mock scheduler initialized
      (mockScheduler as any).isInitialized = true;

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.checks.database.status).toBe('healthy');
      expect(data.checks.alpaca.status).toBe('healthy');
      expect(data.checks.gemini.status).toBe('healthy');
      expect(data.checks.scheduler.status).toBe('healthy');
      expect(data.uptime).toBeGreaterThan(0);
    });

    it('should return unhealthy status when database is down', async () => {
      // Mock database failure
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            error: { message: 'Connection timeout' },
          }),
        }),
      });

      // Mock other services as healthy
      mockAlpacaService.getAccount.mockResolvedValue({} as any);
      mockGeminiService.isConfigured.mockReturnValue(true);
      mockGeminiService.getBalances.mockResolvedValue([]);
      mockScheduler.getJobStatus.mockReturnValue({});
      (mockScheduler as any).isInitialized = true;

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.checks.database.status).toBe('unhealthy');
      expect(data.checks.database.error).toBe('Connection timeout');
    });

    it('should return degraded status when external APIs are down', async () => {
      // Mock database as healthy
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      // Mock API failures
      mockAlpacaService.getAccount.mockRejectedValue(new Error('API rate limit exceeded'));
      mockGeminiService.isConfigured.mockReturnValue(true);
      mockGeminiService.getBalances.mockRejectedValue(new Error('Service unavailable'));
      
      mockScheduler.getJobStatus.mockReturnValue({});
      (mockScheduler as any).isInitialized = true;

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('degraded');
      expect(data.checks.database.status).toBe('healthy');
      expect(data.checks.alpaca.status).toBe('unhealthy');
      expect(data.checks.gemini.status).toBe('unhealthy');
    });
  });

  describe('/api/admin/scheduler', () => {
    it('should return scheduler status when authenticated', async () => {
      mockScheduler.getJobStatus.mockReturnValue({
        dailyWorkflow: {
          name: 'Daily Trading Workflow',
          status: 'active',
          lastRun: new Date('2024-01-01T06:00:00Z'),
          nextRun: new Date('2024-01-02T06:00:00Z'),
          schedule: '0 6 * * *',
          task: 'dailyWorkflow',
          enabled: true,
        } as any,
        marketDataSync: {
          name: 'Market Data Sync',
          status: 'active',
          lastRun: new Date('2024-01-01T12:00:00Z'),
          nextRun: new Date('2024-01-01T12:15:00Z'),
          schedule: '*/15 * * * *',
          task: 'marketDataSync',
          enabled: true,
        } as any,
      });
      
      (mockScheduler as any).isInitialized = true;

      const request = new NextRequest('http://localhost:3000/api/admin/scheduler');
      const response = await SchedulerGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.status).toBeDefined();
      expect(data.data.isInitialized).toBe(true);
      expect(data.data.status.dailyWorkflow.name).toBe('Daily Trading Workflow');
    });

    it('should require authentication for scheduler access', async () => {
      // Mock no user session
      mockAuth.api.getSession.mockResolvedValue({ user: null });

      const request = new NextRequest('http://localhost:3000/api/admin/scheduler');
      const response = await SchedulerGET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should trigger manual job execution', async () => {
      mockScheduler.triggerDailyWorkflow = jest.fn().mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/admin/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'trigger',
          jobId: 'dailyWorkflow',
        }),
      });

      const response = await SchedulerPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.message).toBe('Daily workflow triggered successfully');
      expect(mockScheduler.triggerDailyWorkflow).toHaveBeenCalled();
    });

    it('should handle invalid job trigger requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'trigger',
          jobId: 'invalidJob',
        }),
      });

      const response = await SchedulerPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Unknown job ID: invalidJob');
    });

    it('should enable and disable scheduler jobs', async () => {
      mockScheduler.enableJob = jest.fn();
      mockScheduler.disableJob = jest.fn();

      // Test enable
      let request = new NextRequest('http://localhost:3000/api/admin/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'enable',
          jobId: 'dailyWorkflow',
        }),
      });

      let response = await SchedulerPOST(request);
      let data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.message).toContain('enabled successfully');
      expect(mockScheduler.enableJob).toHaveBeenCalledWith('dailyWorkflow');

      // Test disable
      request = new NextRequest('http://localhost:3000/api/admin/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'disable',
          jobId: 'dailyWorkflow',
        }),
      });

      response = await SchedulerPOST(request);
      data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.message).toContain('disabled successfully');
      expect(mockScheduler.disableJob).toHaveBeenCalledWith('dailyWorkflow');
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Mock a service that throws an unexpected error
      mockSupabase.from = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      // The error structure depends on how the route handles the exception
    });

    it('should handle malformed requests to scheduler', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      const response = await SchedulerPOST(request);
      
      expect(response.status).toBe(500);
    });
  });

  describe('Performance', () => {
    it('should complete health checks within reasonable time', async () => {
      // Mock all services with slight delays
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          count: jest.fn().mockReturnValue({
            limit: jest.fn().mockImplementation(() => 
              new Promise(resolve => 
                setTimeout(() => resolve({ error: null }), 50)
              )
            ),
          }),
        }),
      });

      mockAlpacaService.getAccount.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({} as any), 100)
        )
      );

      const startTime = Date.now();
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const endTime = Date.now();

      expect(response.status).toBe(503);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});