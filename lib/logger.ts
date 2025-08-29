import * as Sentry from '@sentry/nextjs';

interface LogLevel {
  level: 'info' | 'warn' | 'error' | 'debug';
  color: string;
}

const LOG_LEVELS: Record<string, LogLevel> = {
  info: { level: 'info', color: '\x1b[36m' }, // Cyan
  warn: { level: 'warn', color: '\x1b[33m' }, // Yellow
  error: { level: 'error', color: '\x1b[31m' }, // Red
  debug: { level: 'debug', color: '\x1b[35m' }, // Magenta
};

const RESET_COLOR = '\x1b[0m';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private sentryEnabled = typeof window === 'undefined' ? 
    Boolean(process.env.SENTRY_DSN) : 
    Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const logLevel = LOG_LEVELS[level];
    
    if (this.isDevelopment) {
      return `${logLevel.color}[${timestamp}] [${logLevel.level.toUpperCase()}]${RESET_COLOR} ${message}`;
    }
    
    return `[${timestamp}] [${logLevel.level.toUpperCase()}] ${message}`;
  }

  private log(level: string, message: string, ...args: any[]) {
    const formattedMessage = this.formatMessage(level, message);
    
    if (level === 'error') {
      console.error(formattedMessage, ...args);
      
      // Send errors to Sentry
      if (this.sentryEnabled) {
        if (args.length > 0 && args[0] instanceof Error) {
          Sentry.captureException(args[0], {
            tags: { source: 'logger' },
            extra: { 
              message,
              additionalArgs: args.slice(1),
            },
          });
        } else {
          Sentry.captureMessage(message, 'error');
        }
      }
    } else if (level === 'warn') {
      console.warn(formattedMessage, ...args);
      
      // Send warnings to Sentry in production
      if (this.sentryEnabled && !this.isDevelopment) {
        Sentry.captureMessage(message, 'warning');
      }
    } else {
      console.log(formattedMessage, ...args);
    }

    // In production, you might want to send logs to an external service
    if (!this.isDevelopment) {
      this.sendToExternalLogger(level, message, args);
    }
  }

  private sendToExternalLogger(level: string, message: string, args: any[]) {
    // External logging is now handled by Sentry
    // Additional services like LogRocket, DataDog, etc. can be added here
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log('error', message, ...args);
  }

  debug(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      this.log('debug', message, ...args);
    }
  }

  // Structured logging methods
  logJobExecution(jobName: string, duration: number, status: 'success' | 'error', error?: any) {
    const message = `Job ${jobName} ${status} in ${duration}ms`;
    
    if (status === 'error') {
      this.error(message, error);
    } else {
      this.info(message);
    }
  }

  logAPICall(endpoint: string, method: string, duration: number, statusCode?: number) {
    const message = `API ${method} ${endpoint} - ${statusCode || 'unknown'} in ${duration}ms`;
    this.info(message);
  }

  logTrade(portfolioId: string, symbol: string, action: string, quantity: number, price: number) {
    const message = `Trade executed: ${action} ${quantity} ${symbol} at $${price} for portfolio ${portfolioId}`;
    this.info(message);
  }

  logPortfolioUpdate(portfolioId: string, totalValue: number, change: number) {
    const changeStr = change >= 0 ? `+$${change.toFixed(2)}` : `-$${Math.abs(change).toFixed(2)}`;
    const message = `Portfolio ${portfolioId} updated: $${totalValue.toFixed(2)} (${changeStr})`;
    this.info(message);
  }
}

export const logger = new Logger();