// Dynamic imports to avoid Node.js module bundling issues
// import * as cron from 'node-cron';
// import { tradingEngine } from './trading-engine';
// import { portfolioManager } from './portfolio-manager';
// import { dataService } from './data-service'; // Module not found, using direct methods
import { logger } from './logger';
import { supabase } from './supabase';
import { monitorSchedulerJob, reportCriticalError } from './monitoring';

interface SchedulerConfig {
  dailyWorkflow: {
    enabled: boolean;
    time: string; // Cron format
  };
  marketDataSync: {
    enabled: boolean;
    time: string;
  };
  portfolioRebalancing: {
    enabled: boolean;
    time: string;
  };
  systemHealthCheck: {
    enabled: boolean;
    time: string;
  };
}

interface ScheduledJob {
  name: string;
  schedule: string;
  task: () => Promise<void>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  status: 'active' | 'inactive' | 'error';
}

class Scheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private cronJobs: Map<string, any> = new Map(); // Using any for cron.ScheduledTask
  private config: SchedulerConfig;
  private isInitialized = false;

  constructor() {
    this.config = {
      dailyWorkflow: {
        enabled: true,
        time: '0 6 * * 1-5', // 6 AM on weekdays (when market opens)
      },
      marketDataSync: {
        enabled: true,
        time: '*/15 9-16 * * 1-5', // Every 15 minutes during market hours
      },
      portfolioRebalancing: {
        enabled: true,
        time: '0 16 * * 5', // 4 PM on Fridays (after market close)
      },
      systemHealthCheck: {
        enabled: true,
        time: '0 */4 * * *', // Every 4 hours
      },
    };
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info('Initializing scheduler...');

      // Register all scheduled jobs
      this.registerJob('dailyWorkflow', {
        name: 'Daily Trading Workflow',
        schedule: this.config.dailyWorkflow.time,
        task: this.runDailyWorkflow.bind(this),
        enabled: this.config.dailyWorkflow.enabled,
        status: 'inactive',
      });

      this.registerJob('marketDataSync', {
        name: 'Market Data Sync',
        schedule: this.config.marketDataSync.time,
        task: this.syncMarketData.bind(this),
        enabled: this.config.marketDataSync.enabled,
        status: 'inactive',
      });

      this.registerJob('portfolioRebalancing', {
        name: 'Portfolio Rebalancing',
        schedule: this.config.portfolioRebalancing.time,
        task: this.rebalancePortfolios.bind(this),
        enabled: this.config.portfolioRebalancing.enabled,
        status: 'inactive',
      });

      this.registerJob('systemHealthCheck', {
        name: 'System Health Check',
        schedule: this.config.systemHealthCheck.time,
        task: this.performHealthCheck.bind(this),
        enabled: this.config.systemHealthCheck.enabled,
        status: 'inactive',
      });

      // Start all enabled jobs
      await this.startAllJobs();

      this.isInitialized = true;
      logger.info('Scheduler initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize scheduler:', error);
      throw error;
    }
  }

  private registerJob(id: string, job: ScheduledJob) {
    this.jobs.set(id, job);
    logger.info(`Registered job: ${job.name} with schedule: ${job.schedule}`);
  }

  private async startAllJobs() {
    for (const [id, job] of Array.from(this.jobs.entries())) {
      if (job.enabled) {
        await this.startJob(id);
      }
    }
  }

  async startJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (this.cronJobs.has(jobId)) {
      this.stopJob(jobId);
    }

    // Skip cron scheduling in development to avoid bundling issues
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Job ${job.name} would be started in production (skipped in development)`);
      job.status = 'inactive';
      return;
    }

    try {
      // Use eval-based dynamic import to avoid webpack bundling issues
      const cron = await eval('import("node-cron")');
      
      const cronJob = cron.schedule(job.schedule, async () => {
        await this.executeJob(jobId);
      }, {
        timezone: 'America/New_York', // Eastern Time for US markets
      } as any);

      this.cronJobs.set(jobId, cronJob);
      cronJob.start();

      job.status = 'active';
      job.nextRun = this.getNextRunTime(job.schedule);

      logger.info(`Started job: ${job.name}`);
    } catch (error) {
      logger.error(`Failed to start job ${job.name}:`, error);
      job.status = 'error';
    }
  }

  stopJob(jobId: string) {
    const cronJob = this.cronJobs.get(jobId);
    if (cronJob) {
      cronJob.stop();
      this.cronJobs.delete(jobId);
    }

    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'inactive';
    }

    logger.info(`Stopped job: ${jobId}`);
  }

  private async executeJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) {
      logger.error(`Job ${jobId} not found for execution`);
      return;
    }

    try {
      logger.info(`Executing job: ${job.name}`);
      job.lastRun = new Date();
      job.status = 'active';

      await job.task();

      job.nextRun = this.getNextRunTime(job.schedule);
      logger.info(`Job completed successfully: ${job.name}`);

      // Log job execution to database
      await this.logJobExecution(jobId, 'success');
    } catch (error: any) {
      job.status = 'error';
      logger.error(`Job failed: ${job.name}`, error);

      // Log job execution failure to database
      await this.logJobExecution(jobId, 'error', error.message);
    }
  }

  private async logJobExecution(jobId: string, status: 'success' | 'error', errorMessage?: string) {
    try {
      // Note: scheduler_logs table doesn't exist in current schema
      // This would require creating the table first
      // await supabase.from('scheduler_logs').insert({
      //   job_id: jobId,
      //   status,
      //   error_message: errorMessage,
      //   executed_at: new Date().toISOString(),
      // });
      
      // For now, just log to console
      logger.info(`Job ${jobId} execution logged: ${status}`, errorMessage ? { error: errorMessage } : undefined);
    } catch (error) {
      logger.error('Failed to log job execution:', error);
    }
  }

  private getNextRunTime(schedule: string): Date {
    try {
      // Since nextDate() might not exist in this version, calculate manually or return approximate
      const now = new Date();
      return new Date(now.getTime() + 60 * 60 * 1000); // Approximate: 1 hour from now
    } catch (error) {
      // Return a default next run time if calculation fails
      const now = new Date();
      return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    }
  }

  // Main workflow that runs every day
  private async runDailyWorkflow() {
    logger.info('Starting daily trading workflow...');

    try {
      // Dynamic imports to avoid module bundling issues
      const { portfolioManager } = await import('./portfolio-manager');
      const { tradingEngine } = await import('./trading-engine');
      
      // 1. Sync market data
      await this.syncMarketData();

      // 2. Get all active portfolios
      const activePortfolios = await portfolioManager.getActivePortfolios();

      // 3. Run automated trading for each portfolio
      for (const portfolio of activePortfolios) {
        try {
          logger.info(`Processing portfolio: ${portfolio.id}`);
          await tradingEngine.processAutomatedTrading(portfolio.userId, portfolio.id);
        } catch (error) {
          logger.error(`Failed to process portfolio ${portfolio.id}:`, error);
        }
      }

      // 4. Generate daily reports
      await this.generateDailyReports();

      logger.info('Daily workflow completed successfully');
    } catch (error) {
      logger.error('Daily workflow failed:', error);
      throw error;
    }
  }

  private async syncMarketData() {
    logger.info('Syncing market data...');

    try {
      // Note: dataService module not found, implementing basic sync
      // await dataService.syncAllMarketData();
      
      // For now, just log that market data sync would happen here
      logger.info('Market data sync would be executed here (dataService not available)');
      
      logger.info('Market data sync completed');
    } catch (error) {
      logger.error('Market data sync failed:', error);
      throw error;
    }
  }

  private async rebalancePortfolios() {
    logger.info('Starting portfolio rebalancing...');

    try {
      const { portfolioManager } = await import('./portfolio-manager');
      
      const portfolios = await portfolioManager.getPortfoliosForRebalancing();

      for (const portfolio of portfolios) {
        try {
          await portfolioManager.rebalancePortfolio(portfolio.id);
          logger.info(`Rebalanced portfolio: ${portfolio.id}`);
        } catch (error) {
          logger.error(`Failed to rebalance portfolio ${portfolio.id}:`, error);
        }
      }

      logger.info('Portfolio rebalancing completed');
    } catch (error) {
      logger.error('Portfolio rebalancing failed:', error);
      throw error;
    }
  }

  private async performHealthCheck() {
    logger.info('Performing system health check...');

    try {
      const healthStatus = {
        timestamp: new Date().toISOString(),
        scheduler: 'healthy',
        database: 'unknown',
        apis: {
          alpaca: 'unknown',
          gemini: 'unknown',
        },
      };

      // Check database connection
      try {
        if (supabase) {
          const { error } = await supabase.from('portfolios').select('count', { count: 'exact' });
          healthStatus.database = error ? 'unhealthy' : 'healthy';
        } else {
          healthStatus.database = 'unavailable';
        }
      } catch (error) {
        healthStatus.database = 'unhealthy';
      }

      // Check API connections
      try {
        // await dataService.testAPIConnections();
        // Note: dataService not available, using placeholder health status
        healthStatus.apis.alpaca = 'unknown';
        healthStatus.apis.gemini = 'unknown';
        logger.info('API connection check would be performed here (dataService not available)');
      } catch (error) {
        healthStatus.apis.alpaca = 'unhealthy';
        healthStatus.apis.gemini = 'unhealthy';
      }

      // Log health status - note: system_health table doesn't exist in current schema
      // await supabase.from('system_health').insert(healthStatus as any);
      
      // For now, just log to console
      logger.info('Health status recorded:', healthStatus);

      logger.info('Health check completed', healthStatus);
    } catch (error) {
      logger.error('Health check failed:', error);
      throw error;
    }
  }

  private async generateDailyReports() {
    logger.info('Generating daily reports...');

    try {
      const { portfolioManager } = await import('./portfolio-manager');
      
      // Get all portfolios
      const portfolios = await portfolioManager.getAllPortfolios();

      for (const portfolio of portfolios) {
        try {
          const report = await portfolioManager.generateDailyReport(portfolio.id);
          
          // Save report to database - note: daily_reports table doesn't exist in current schema
          // await supabase.from('daily_reports').insert({
          //   portfolio_id: portfolio.id,
          //   report_data: report,
          //   generated_at: new Date().toISOString(),
          // } as any);
          
          // For now, just log the report generation
          logger.info(`Daily report generated for portfolio ${portfolio.id}:`, { reportSize: JSON.stringify(report).length });

          logger.info(`Generated daily report for portfolio: ${portfolio.id}`);
        } catch (error) {
          logger.error(`Failed to generate report for portfolio ${portfolio.id}:`, error);
        }
      }

      logger.info('Daily reports generation completed');
    } catch (error) {
      logger.error('Daily reports generation failed:', error);
      throw error;
    }
  }

  // Manual trigger methods
  async triggerDailyWorkflow() {
    return this.executeJob('dailyWorkflow');
  }

  async triggerMarketDataSync() {
    return this.executeJob('marketDataSync');
  }

  async triggerPortfolioRebalancing() {
    return this.executeJob('portfolioRebalancing');
  }

  async triggerHealthCheck() {
    return this.executeJob('systemHealthCheck');
  }

  // Status and management methods
  getJobStatus(jobId?: string) {
    if (jobId) {
      const job = this.jobs.get(jobId);
      return job ? { [jobId]: job } : null;
    }

    const status: Record<string, ScheduledJob> = {};
    for (const [id, job] of Array.from(this.jobs.entries())) {
      status[id] = job;
    }
    return status;
  }

  async updateJobSchedule(jobId: string, newSchedule: string) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.schedule = newSchedule;
    job.nextRun = this.getNextRunTime(newSchedule);

    if (job.status === 'active') {
      this.stopJob(jobId);
      await this.startJob(jobId);
    }

    logger.info(`Updated schedule for job ${jobId}: ${newSchedule}`);
  }

  async enableJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.enabled = true;
    if (job.status !== 'active') {
      await this.startJob(jobId);
    }
  }

  disableJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.enabled = false;
    if (job.status === 'active') {
      this.stopJob(jobId);
    }
  }

  shutdown() {
    logger.info('Shutting down scheduler...');

    const jobIds = Array.from(this.jobs.keys());
    for (const jobId of jobIds) {
      this.stopJob(jobId);
    }

    this.isInitialized = false;
    logger.info('Scheduler shutdown completed');
  }
}

export const scheduler = new Scheduler();