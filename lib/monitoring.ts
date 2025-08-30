// Simple monitoring implementation without Sentry

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
  try {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    
    console.log(`Trade Execution: ${context.action || 'unknown'} ${context.symbol || ''} completed in ${duration}ms`);
    
    return result;
  } catch (error) {
    console.error(`Trade Execution failed for portfolio ${context.portfolioId}`, error);
    throw error;
  }
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
  try {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    
    console.log(`Portfolio Analysis: ${context.analysisType} completed in ${duration}ms for portfolio ${context.portfolioId}`);
    
    return result;
  } catch (error) {
    console.error(`Portfolio Analysis failed for portfolio ${context.portfolioId}`, error);
    throw error;
  }
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
  try {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    
    console.log(`Market Data Sync: ${context.source} completed in ${duration}ms`);
    
    // Log performance metrics
    console.log(`Market data sync success: ${context.source}`, {
      symbolCount: context.symbolCount || 0,
      duration,
      dataType: context.dataType || ''
    });
    
    return result;
  } catch (error) {
    console.error(`Market Data Sync failed for source ${context.source}`, error);
    
    // Log error
    console.error(`Market data sync error: ${context.source}`, error);
    
    throw error;
  }
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
  try {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    
    console.log(`API Call: ${context.service} ${context.method} ${context.endpoint} completed in ${duration}ms`);
    
    // Track API performance
    console.log(`API call success: ${context.service}`, {
      endpoint: context.endpoint,
      method: context.method,
      duration
    });
    
    return result;
  } catch (error) {
    const startTime = Date.now();
    const duration = Date.now() - startTime;
    
    console.error(`API Call failed: ${context.service} ${context.method} ${context.endpoint}`, error);
    
    // Track API errors
    console.error(`API call error: ${context.service}`, {
      endpoint: context.endpoint,
      method: context.method,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
};

// Scheduler job monitoring
export const monitorSchedulerJob = async <T>(
  operation: () => Promise<T>,
  context: {
    jobName: string;
    jobType: string;
  }
): Promise<T> => {
  try {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    
    console.log(`Scheduler Job: ${context.jobName} completed in ${duration}ms`);
    
    // Track job performance
    console.log(`Scheduler job success: ${context.jobName}`, {
      jobType: context.jobType,
      duration
    });
    
    return result;
  } catch (error) {
    const startTime = Date.now();
    const duration = Date.now() - startTime;
    
    console.error(`Scheduler Job failed: ${context.jobName}`, error);
    
    // Track job errors
    console.error(`Scheduler job error: ${context.jobName}`, {
      jobType: context.jobType,
      duration
    });
    
    throw error;
  }
};

// Custom metric helpers
export const trackBusinessMetric = (
  metricName: string,
  value: number,
  tags?: Record<string, string>
) => {
  console.log(`Business Metric: ${metricName} = ${value}`, tags || {});
};

export const trackUserAction = (
  action: string,
  userId?: string,
  additionalData?: Record<string, any>
) => {
  console.log(`User Action: ${action}`, {
    userId,
    ...additionalData
  });
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
  console.error(`Critical Error in ${context.component}/${context.operation}:`, {
    error: error.message,
    userId: context.userId,
    portfolioId: context.portfolioId,
    ...context.additionalData
  });
};

// System health monitoring
export const monitorSystemHealth = async () => {
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
    try {
      const { supabase } = await import('./supabase');
      if (supabase) {
        const { error } = await supabase.from('portfolios').select('count', { count: 'exact' });
        healthStatus.database = error ? 'unhealthy' : 'healthy';
      } else {
        healthStatus.database = 'unhealthy';
      }
    } catch (error) {
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
    
    console.log('System health check completed:', {
      database: healthStatus.database,
      alpaca: healthStatus.apis.alpaca,
      gemini: healthStatus.apis.gemini,
      overall: healthStatus.overall
    });
    
    // Track health metrics
    console.log('System health metrics:', {
      overall: healthStatus.overall === 'healthy' ? 1 : 0,
      database: healthStatus.database === 'healthy' ? 1 : 0,
      alpaca: healthStatus.apis.alpaca === 'healthy' ? 1 : 0,
      gemini: healthStatus.apis.gemini === 'healthy' ? 1 : 0
    });
    
    return healthStatus;
  } catch (error) {
    console.error('System health check failed:', error);
    
    healthStatus.overall = 'unhealthy';
    return healthStatus;
  }
};