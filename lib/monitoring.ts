import * as Sentry from '@sentry/nextjs';

// Trading operation monitoring
export const monitorTradeExecution = async <T>(
  operation: () => Promise<T>,
  context: {
    portfolioId: string;
    symbol?: string;
    action?: string;
    userId?: string;
  }
): Promise<T> => {
  return await Sentry.startSpan(
    {
      op: 'trade.execution',
      name: `Trade Execution: ${context.action || 'unknown'} ${context.symbol || ''}`,
      attributes: {
        portfolioId: context.portfolioId,
        symbol: context.symbol || '',
        action: context.action || '',
      },
    },
    async (span) => {
      try {
        const result = await operation();
        
        span.setAttribute('status', 'success');
        span.setAttribute('timestamp', new Date().toISOString());
        
        return result;
      } catch (error) {
        span.setAttribute('status', 'error');
        span.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
        span.setAttribute('timestamp', new Date().toISOString());
        
        Sentry.captureException(error, {
          tags: {
            operation: 'trade_execution',
            portfolioId: context.portfolioId,
            symbol: context.symbol,
            action: context.action,
          },
          user: context.userId ? { id: context.userId } : undefined,
        });
        
        throw error;
      }
    }
  );
};

// Portfolio analysis monitoring
export const monitorPortfolioAnalysis = async <T>(
  operation: () => Promise<T>,
  context: {
    portfolioId: string;
    analysisType: string;
    userId?: string;
  }
): Promise<T> => {
  return await Sentry.startSpan(
    {
      op: 'portfolio.analysis',
      name: `Portfolio Analysis: ${context.analysisType}`,
      attributes: {
        portfolioId: context.portfolioId,
        analysisType: context.analysisType,
      },
    },
    async (span) => {
      try {
        const result = await operation();
        
        span.setAttribute('status', 'success');
        span.setAttribute('analysis_type', context.analysisType);
        span.setAttribute('timestamp', new Date().toISOString());
        
        return result;
      } catch (error) {
        span.setAttribute('status', 'error');
        
        Sentry.captureException(error, {
          tags: {
            operation: 'portfolio_analysis',
            portfolioId: context.portfolioId,
            analysisType: context.analysisType,
          },
          user: context.userId ? { id: context.userId } : undefined,
        });
        
        throw error;
      }
    }
  );
};

// Market data monitoring
export const monitorMarketDataSync = async <T>(
  operation: () => Promise<T>,
  context: {
    source: 'alpaca' | 'gemini';
    symbolCount?: number;
    dataType?: string;
  }
): Promise<T> => {
  return await Sentry.startSpan(
    {
      op: 'market.data.sync',
      name: `Market Data Sync: ${context.source}`,
      attributes: {
        source: context.source,
        dataType: context.dataType || '',
      },
    },
    async (span) => {
      const startTime = Date.now();
      
      try {
        const result = await operation();
        
        const duration = Date.now() - startTime;
        
        span.setAttribute('status', 'success');
        span.setAttribute('source', context.source);
        span.setAttribute('symbolCount', context.symbolCount || 0);
        span.setAttribute('duration', duration);
        span.setAttribute('timestamp', new Date().toISOString());
        
        // Log performance metrics
        Sentry.metrics.increment('market_data.sync.success', 1, {
          tags: {
            source: context.source,
          },
        });
        
        Sentry.metrics.distribution('market_data.sync.duration', duration, {
          tags: {
            source: context.source,
          },
        });
        
        return result;
      } catch (error) {
        span.setAttribute('status', 'error');
        
        Sentry.metrics.increment('market_data.sync.error', 1, {
          tags: {
            source: context.source,
          },
        });
        
        Sentry.captureException(error, {
          tags: {
            operation: 'market_data_sync',
            source: context.source,
            dataType: context.dataType,
          },
        });
        
        throw error;
      }
    }
  );
};

// API call monitoring
export const monitorAPICall = async <T>(
  operation: () => Promise<T>,
  context: {
    service: string;
    endpoint: string;
    method: string;
  }
): Promise<T> => {
  return await Sentry.startSpan(
    {
      op: 'api.call',
      name: `API Call: ${context.service} ${context.method} ${context.endpoint}`,
      attributes: {
        service: context.service,
        endpoint: context.endpoint,
        method: context.method,
      },
    },
    async (span) => {
      const startTime = Date.now();
      
      try {
        const result = await operation();
        
        const duration = Date.now() - startTime;
        
        span.setAttribute('status', 'success');
        span.setAttribute('service', context.service);
        span.setAttribute('endpoint', context.endpoint);
        span.setAttribute('duration', duration);
        span.setAttribute('timestamp', new Date().toISOString());
        
        // Track API performance
        Sentry.metrics.increment('api.call.success', 1, {
          tags: {
            service: context.service,
          },
        });
        
        Sentry.metrics.distribution('api.call.duration', duration, {
          tags: {
            service: context.service,
            endpoint: context.endpoint,
          },
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        span.setAttribute('status', 'error');
        span.setAttribute('service', context.service);
        span.setAttribute('endpoint', context.endpoint);
        span.setAttribute('duration', duration);
        span.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
        
        // Track API errors
        Sentry.metrics.increment('api.call.error', 1, {
          tags: {
            service: context.service,
            endpoint: context.endpoint,
          },
        });
        
        Sentry.captureException(error, {
          tags: {
            operation: 'api_call',
            service: context.service,
            endpoint: context.endpoint,
            method: context.method,
          },
        });
        
        throw error;
      }
    }
  );
};

// Scheduler job monitoring
export const monitorSchedulerJob = async <T>(
  operation: () => Promise<T>,
  context: {
    jobName: string;
    jobType: string;
  }
): Promise<T> => {
  return await Sentry.startSpan(
    {
      op: 'scheduler.job',
      name: `Scheduler Job: ${context.jobName}`,
      attributes: {
        jobName: context.jobName,
        jobType: context.jobType,
      },
    },
    async (span) => {
      const startTime = Date.now();
      
      try {
        const result = await operation();
        
        const duration = Date.now() - startTime;
        
        span.setAttribute('status', 'success');
        span.setAttribute('jobName', context.jobName);
        span.setAttribute('duration', duration);
        span.setAttribute('timestamp', new Date().toISOString());
        
        // Track job performance
        Sentry.metrics.increment('scheduler.job.success', 1, {
          tags: {
            jobName: context.jobName,
          },
        });
        
        Sentry.metrics.distribution('scheduler.job.duration', duration, {
          tags: {
            jobName: context.jobName,
          },
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        span.setAttribute('status', 'error');
        
        // Track job errors
        Sentry.metrics.increment('scheduler.job.error', 1, {
          tags: {
            jobName: context.jobName,
          },
        });
        
        Sentry.captureException(error, {
          tags: {
            operation: 'scheduler_job',
            jobName: context.jobName,
            jobType: context.jobType,
          },
        });
        
        throw error;
      }
    }
  );
};

// Custom metric helpers
export const trackBusinessMetric = (
  metricName: string,
  value: number,
  tags?: Record<string, string>
) => {
  Sentry.metrics.gauge(metricName, value, {
    tags: {
      component: 'ai-trader',
      ...tags,
    },
  });
};

export const trackUserAction = (
  action: string,
  userId?: string,
  additionalData?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    category: 'user.action',
    message: action,
    level: 'info',
    data: additionalData,
  });
  
  if (userId) {
    Sentry.setUser({ id: userId });
  }
};

// Error reporting helpers
export const reportCriticalError = (
  error: Error,
  context: {
    component: string;
    operation: string;
    userId?: string;
    portfolioId?: string;
    additionalData?: Record<string, any>;
  }
) => {
  Sentry.withScope((scope) => {
    scope.setTag('severity', 'critical');
    scope.setTag('component', context.component);
    scope.setTag('operation', context.operation);
    
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    
    if (context.portfolioId) {
      scope.setTag('portfolioId', context.portfolioId);
    }
    
    if (context.additionalData) {
      scope.setContext('additional_data', context.additionalData);
    }
    
    Sentry.captureException(error);
  });
};

// System health monitoring
export const monitorSystemHealth = async () => {
  return await Sentry.startSpan(
    {
      op: 'system.health.check',
      name: 'System Health Check',
    },
    async (span) => {
      const healthStatus = {
        timestamp: new Date().toISOString(),
        database: 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
        apis: {
          alpaca: 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
          gemini: 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
        },
        scheduler: 'healthy' as 'healthy' | 'unhealthy',
        overall: 'unknown' as 'healthy' | 'unhealthy' | 'degraded',
      };
      
      try {
        // Check database connection
        const { supabase } = await import('./supabase');
        if (supabase) {
          const { error } = await supabase.from('portfolios').select('count', { count: 'exact' });
          healthStatus.database = error ? 'unhealthy' : 'healthy';
        } else {
          healthStatus.database = 'unhealthy';
        }
        
        // Check API connections (basic connectivity)
        try {
          const { alpacaService } = await import('./alpaca');
          await alpacaService.getAccount();
          healthStatus.apis.alpaca = 'healthy';
        } catch (error) {
          healthStatus.apis.alpaca = 'unhealthy';
        }
        
        try {
          const { geminiService } = await import('./gemini');
          if (geminiService.isConfigured()) {
            await geminiService.getBalances();
            healthStatus.apis.gemini = 'healthy';
          }
        } catch (error) {
          healthStatus.apis.gemini = 'unhealthy';
        }
        
        // Determine overall health
        const unhealthyComponents = [
          healthStatus.database === 'unhealthy',
          healthStatus.apis.alpaca === 'unhealthy',
          healthStatus.apis.gemini === 'unhealthy',
        ].filter(Boolean).length;
        
        if (unhealthyComponents === 0) {
          healthStatus.overall = 'healthy';
        } else if (unhealthyComponents >= 2) {
          healthStatus.overall = 'unhealthy';
        } else {
          healthStatus.overall = 'degraded';
        }
        
        span.setAttribute('status', 'success');
        span.setAttribute('health.database', healthStatus.database);
        span.setAttribute('health.alpaca', healthStatus.apis.alpaca);
        span.setAttribute('health.gemini', healthStatus.apis.gemini);
        span.setAttribute('health.overall', healthStatus.overall);
        
        // Track health metrics
        Sentry.metrics.gauge('system.health.overall', healthStatus.overall === 'healthy' ? 1 : 0);
        Sentry.metrics.gauge('system.health.database', healthStatus.database === 'healthy' ? 1 : 0);
        Sentry.metrics.gauge('system.health.alpaca', healthStatus.apis.alpaca === 'healthy' ? 1 : 0);
        Sentry.metrics.gauge('system.health.gemini', healthStatus.apis.gemini === 'healthy' ? 1 : 0);
        
        return healthStatus;
      } catch (error) {
        span.setAttribute('status', 'error');
        
        Sentry.captureException(error, {
          tags: {
            operation: 'system_health_check',
          },
        });
        
        healthStatus.overall = 'unhealthy';
        return healthStatus;
      }
    }
  );
};