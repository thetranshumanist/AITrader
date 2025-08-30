import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { scheduler } from '@/lib/scheduler';
import { trackBusinessMetric } from '@/lib/monitoring';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    alpaca: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    gemini: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    scheduler: {
      status: 'healthy' | 'unhealthy';
      activeJobs?: number;
      error?: string;
    };
  };
  timestamp: string;
  version: string;
  uptime: number;
}

export async function GET(request: NextRequest) {
  const healthCheck: HealthCheckResult = {
    status: 'healthy',
    checks: {
      database: { status: 'unhealthy' },
      alpaca: { status: 'unhealthy' },
      gemini: { status: 'unhealthy' },
      scheduler: { status: 'unhealthy' },
    },
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
  };

  let overallHealthy = true;

  try {
    // Check database health
    const dbStart = Date.now();
    try {
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }
      
      const { error } = await supabaseAdmin
        .from('portfolios')
        .select('count', { count: 'exact' })
        .limit(1);
      
      const dbResponseTime = Date.now() - dbStart;
      
      if (error) {
        healthCheck.checks.database = {
          status: 'unhealthy',
          responseTime: dbResponseTime,
          error: error.message,
        };
        overallHealthy = false;
      } else {
        healthCheck.checks.database = {
          status: 'healthy',
          responseTime: dbResponseTime,
        };
      }

      // Track database response time
      trackBusinessMetric('health.database.response_time', dbResponseTime);
    } catch (error: any) {
      healthCheck.checks.database = {
        status: 'unhealthy',
        error: error.message,
      };
      overallHealthy = false;
    }

    // Check Alpaca API health
    const alpacaStart = Date.now();
    try {
      // Dynamic import to prevent build-time instantiation
      const { alpacaService } = await import('@/lib/alpaca');
      
      await alpacaService.getAccount();
      const alpacaResponseTime = Date.now() - alpacaStart;
      
      healthCheck.checks.alpaca = {
        status: 'healthy',
        responseTime: alpacaResponseTime,
      };

      // Track Alpaca response time
      trackBusinessMetric('health.alpaca.response_time', alpacaResponseTime);
    } catch (error: any) {
      healthCheck.checks.alpaca = {
        status: 'unhealthy',
        responseTime: Date.now() - alpacaStart,
        error: error.message,
      };
      // Alpaca issues are degraded, not critical
    }

    // Check Gemini API health
    const geminiStart = Date.now();
    try {
      // Dynamic import to prevent build-time instantiation
      const { geminiService } = await import('@/lib/gemini');
      
      if (geminiService.isConfigured()) {
        await geminiService.getBalances();
        const geminiResponseTime = Date.now() - geminiStart;
        
        healthCheck.checks.gemini = {
          status: 'healthy',
          responseTime: geminiResponseTime,
        };

        // Track Gemini response time
        trackBusinessMetric('health.gemini.response_time', geminiResponseTime);
      } else {
        healthCheck.checks.gemini = {
          status: 'unhealthy',
          error: 'Gemini not configured',
        };
      }
    } catch (error: any) {
      healthCheck.checks.gemini = {
        status: 'unhealthy',
        responseTime: Date.now() - geminiStart,
        error: error.message,
      };
      // Gemini issues are degraded, not critical
    }

    // Check scheduler health
    try {
      const jobStatus = scheduler.getJobStatus();
      const activeJobs = Object.values(jobStatus || {}).filter(
        (job: any) => job.status === 'active'
      ).length;
      
      healthCheck.checks.scheduler = {
        status: scheduler['isInitialized'] ? 'healthy' : 'unhealthy',
        activeJobs,
      };

      if (!scheduler['isInitialized']) {
        healthCheck.checks.scheduler.error = 'Scheduler not initialized';
        overallHealthy = false;
      }

      // Track active jobs
      trackBusinessMetric('scheduler.active_jobs', activeJobs);
    } catch (error: any) {
      healthCheck.checks.scheduler = {
        status: 'unhealthy',
        error: error.message,
      };
      overallHealthy = false;
    }

    // Determine overall health status
    const unhealthyChecks = Object.values(healthCheck.checks).filter(
      check => check.status === 'unhealthy'
    ).length;

    if (!overallHealthy || healthCheck.checks.database.status === 'unhealthy') {
      healthCheck.status = 'unhealthy';
    } else if (unhealthyChecks > 0) {
      healthCheck.status = 'degraded';
    } else {
      healthCheck.status = 'healthy';
    }

    // Track overall health
    trackBusinessMetric('health.overall', healthCheck.status === 'healthy' ? 1 : 0);

    // Log health check
    console.log('Health check completed:', {
      status: healthCheck.status,
      unhealthyChecks,
      uptime: healthCheck.uptime,
    });

    // Return appropriate HTTP status
    const httpStatus = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthCheck, { status: httpStatus });

  } catch (error: any) {
    // Critical error in health check itself
    console.error('Health check system failure:', error);

    const errorResponse: HealthCheckResult = {
      ...healthCheck,
      status: 'unhealthy',
      checks: {
        database: { status: 'unhealthy', error: 'Health check failed' },
        alpaca: { status: 'unhealthy', error: 'Health check failed' },
        gemini: { status: 'unhealthy', error: 'Health check failed' },
        scheduler: { status: 'unhealthy', error: 'Health check failed' },
      },
    };

    return NextResponse.json(
      {
        ...errorResponse,
        error: 'Health check system failure',
        details: error.message,
      },
      { status: 503 }
    );
  }
}

// Simple ping endpoint for basic availability checks
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}