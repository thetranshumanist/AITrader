export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize Sentry for server-side
    if (process.env.SENTRY_DSN) {
      const { init } = await import('@sentry/nextjs');
      
      init({
        dsn: process.env.SENTRY_DSN,
        debug: process.env.NODE_ENV === 'development',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        environment: process.env.NODE_ENV || 'development',
        release: process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
        
        beforeSend(event) {
          // Filter out sensitive information from server events
          if (event.exception) {
            event.exception.values?.forEach((exception) => {
              if (exception.stacktrace?.frames) {
                exception.stacktrace.frames.forEach((frame) => {
                  if (frame.vars) {
                    Object.keys(frame.vars).forEach((key) => {
                      if (key.toLowerCase().includes('password') || 
                          key.toLowerCase().includes('secret') ||
                          key.toLowerCase().includes('key') ||
                          key.toLowerCase().includes('token')) {
                        frame.vars![key] = '[Filtered]';
                      }
                    });
                  }
                });
              }
            });
          }
          
          // Filter sensitive data from request context
          if (event.request) {
            if (event.request.headers) {
              ['authorization', 'cookie', 'x-api-key'].forEach((header) => {
                if (event.request!.headers![header]) {
                  event.request!.headers![header] = '[Filtered]';
                }
              });
            }
            
            if (event.request.query_string && typeof event.request.query_string === 'string') {
              const filteredQuery = event.request.query_string.replace(
                /(api_?key|secret|token|password)=[^&]*/gi,
                '$1=[Filtered]'
              );
              event.request.query_string = filteredQuery;
            }
          }
          
          return event;
        },
        
        initialScope: {
          tags: {
            component: 'ai-trader',
            service: 'nextjs-server',
          },
        },
        
        ignoreErrors: [
          'connection timeout',
          'ECONNRESET',
          'ENOTFOUND',
          'rate limit',
          'Too Many Requests',
          'Server is shutting down',
          'SIGTERM',
          'SIGINT',
        ],
      });
    }
    
    try {
      // Dynamic imports to avoid bundling issues
      const { scheduler } = await import('./lib/scheduler');
      const { logger } = await import('./lib/logger');
      
      logger.info('Registering instrumentation...');
      
      // Initialize scheduler in production or when explicitly enabled
      if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
        logger.info('Initializing scheduler...');
        await scheduler.initialize();
        logger.info('Scheduler initialized successfully');
      } else {
        logger.info('Scheduler disabled in development environment');
        logger.info('Set ENABLE_SCHEDULER=true to enable scheduler in development');
      }
    } catch (error) {
      console.error('Failed to initialize scheduler:', error);
    }
  }
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    try {
      const { logger } = await import('./lib/logger');
      const { scheduler } = await import('./lib/scheduler');
      logger.info('Received SIGINT, shutting down scheduler...');
      scheduler.shutdown();
    } catch (error) {
      console.log('Received SIGINT, shutting down...');
    }
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    try {
      const { logger } = await import('./lib/logger');
      const { scheduler } = await import('./lib/scheduler');
      logger.info('Received SIGTERM, shutting down scheduler...');
      scheduler.shutdown();
    } catch (error) {
      console.log('Received SIGTERM, shutting down...');
    }
    process.exit(0);
  });
}