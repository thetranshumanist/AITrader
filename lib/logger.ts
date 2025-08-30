// Simple logger implementation without Sentry
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const levelColors: Record<string, string> = {
      info: '\x1b[36m', // Cyan
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
      debug: '\x1b[35m', // Magenta
    };
    
    const color = levelColors[level] || '';
    const resetColor = '\x1b[0m';
    
    if (this.isDevelopment) {
      return `${color}[${timestamp}] [${level.toUpperCase()}]${resetColor} ${message}`;
    }
    
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  private log(level: string, message: string, ...args: any[]) {
    const formattedMessage = this.formatMessage(level, message);
    
    if (level === 'error') {
      console.error(formattedMessage, ...args);
    } else if (level === 'warn') {
      console.warn(formattedMessage, ...args);
    } else {
      console.log(formattedMessage, ...args);
    }
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