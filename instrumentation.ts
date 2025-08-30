export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
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