import { alpacaService } from './alpaca';
import { geminiService } from './gemini';
import { supabaseAdmin } from './supabase';
import { logger } from './logger';

interface MarketDataSync {
  symbol: string;
  assetType: 'stock' | 'crypto';
  price: number;
  volume?: number;
  timestamp: Date;
}

class DataService {
  // Main method to sync all market data
  async syncAllMarketData(): Promise<{
    stocksSynced: number;
    cryptoSynced: number;
    errors: string[];
  }> {
    const result: {
      stocksSynced: number;
      cryptoSynced: number;
      errors: string[];
    } = {
      stocksSynced: 0,
      cryptoSynced: 0,
      errors: [],
    };

    try {
      logger.info('Starting market data sync...');

      // Get all tracked symbols from database
      const trackedSymbols = await this.getTrackedSymbols();

      // Sync stock data
      const stockSymbols = trackedSymbols.filter(s => s.assetType === 'stock');
      if (stockSymbols.length > 0) {
        try {
          const stockData = await this.syncStockData(stockSymbols.map(s => s.symbol));
          result.stocksSynced = stockData.length;
          logger.info(`Synced ${stockData.length} stock symbols`);
        } catch (error: any) {
          result.errors.push(`Stock sync error: ${error.message}`);
          logger.error('Stock data sync failed:', error);
        }
      }

      // Sync crypto data
      const cryptoSymbols = trackedSymbols.filter(s => s.assetType === 'crypto');
      if (cryptoSymbols.length > 0) {
        try {
          const cryptoData = await this.syncCryptoData(cryptoSymbols.map(s => s.symbol));
          result.cryptoSynced = cryptoData.length;
          logger.info(`Synced ${cryptoData.length} crypto symbols`);
        } catch (error: any) {
          result.errors.push(`Crypto sync error: ${error.message}`);
          logger.error('Crypto data sync failed:', error);
        }
      }

      logger.info('Market data sync completed', result);
      return result;
    } catch (error: any) {
      logger.error('Market data sync failed:', error);
      throw new Error(`Market data sync failed: ${error.message}`);
    }
  }

  // Get all symbols being tracked in portfolios
  private async getTrackedSymbols(): Promise<Array<{ symbol: string; assetType: 'stock' | 'crypto' }>> {
    if (!supabaseAdmin) {
      throw new Error('Database not available');
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('positions')
        .select('symbol, asset_type')
        .gt('quantity', 0);

      if (error) throw error;

      // Remove duplicates and return unique symbols
      const uniqueSymbols = new Map<string, 'stock' | 'crypto'>();
      (data || []).forEach((position: any) => {
        uniqueSymbols.set(position.symbol, position.asset_type);
      });

      return Array.from(uniqueSymbols.entries()).map(([symbol, assetType]) => ({
        symbol,
        assetType,
      }));
    } catch (error: any) {
      throw new Error(`Failed to get tracked symbols: ${error.message}`);
    }
  }

  // Sync stock market data
  private async syncStockData(symbols: string[]): Promise<MarketDataSync[]> {
    const syncedData: MarketDataSync[] = [];

    try {
      // Use Alpaca's multi-quote API to get all symbols at once
      const quotes = await alpacaService.getLatestQuotes(symbols);

      for (const quote of quotes) {
        if (quote && quote.askPrice > 0) {
          const marketData: MarketDataSync = {
            symbol: quote.symbol,
            assetType: 'stock',
            price: quote.askPrice,
            volume: quote.askSize,
            timestamp: new Date(),
          };

          await this.saveMarketData(marketData);
          syncedData.push(marketData);
        }
      }
    } catch (error: any) {
      logger.error('Failed to sync stock data:', error);
      throw error;
    }

    return syncedData;
  }

  // Sync crypto market data
  private async syncCryptoData(symbols: string[]): Promise<MarketDataSync[]> {
    const syncedData: MarketDataSync[] = [];

    try {
      for (const symbol of symbols) {
        try {
          const ticker = await geminiService.getTicker(symbol);
          
          if (ticker && ticker.price > 0) {
            const marketData: MarketDataSync = {
              symbol,
              assetType: 'crypto',
              price: ticker.price,
              volume: ticker.volume,
              timestamp: new Date(),
            };

            await this.saveMarketData(marketData);
            syncedData.push(marketData);
          }
        } catch (error: any) {
          logger.warn(`Failed to sync crypto data for ${symbol}:`, error.message);
          // Continue with other symbols even if one fails
        }
      }
    } catch (error: any) {
      logger.error('Failed to sync crypto data:', error);
      throw error;
    }

    return syncedData;
  }

  // Save market data to appropriate database table based on asset type
  private async saveMarketData(data: MarketDataSync): Promise<void> {
    if (!supabaseAdmin) {
      return;
    }

    try {
      if (data.assetType === 'stock') {
        const stockDataRecord = {
          symbol: data.symbol,
          price: data.price,
          volume: data.volume || 0,
          timestamp: data.timestamp.toISOString(),
          open: data.price, // Using current price as open for real-time data
          high: data.price,
          low: data.price,
          close: data.price,
          change: 0,
          change_percent: 0,
        };

        const { error } = await supabaseAdmin
          .from('stock_data')
          .insert([stockDataRecord] as any);

        if (error) {
          logger.warn(`Failed to save stock data for ${data.symbol}:`, error.message);
        }
      } else {
        const cryptoDataRecord = {
          symbol: data.symbol,
          price: data.price,
          volume: data.volume || 0,
          timestamp: data.timestamp.toISOString(),
          high_24h: data.price,
          low_24h: data.price,
          change_24h: 0,
          change_percent_24h: 0,
        };

        const { error } = await supabaseAdmin
          .from('crypto_data')
          .insert([cryptoDataRecord] as any);

        if (error) {
          logger.warn(`Failed to save crypto data for ${data.symbol}:`, error.message);
        }
      }
    } catch (error: any) {
      logger.warn(`Failed to save market data for ${data.symbol}:`, error.message);
    }
  }

  // Test API connections
  async testAPIConnections(): Promise<{
    alpaca: { status: 'healthy' | 'unhealthy'; error?: string };
    gemini: { status: 'healthy' | 'unhealthy'; error?: string };
  }> {
    const result: {
      alpaca: { status: 'healthy' | 'unhealthy'; error?: string };
      gemini: { status: 'healthy' | 'unhealthy'; error?: string };
    } = {
      alpaca: { status: 'unhealthy', error: undefined },
      gemini: { status: 'unhealthy', error: undefined },
    };

    // Test Alpaca connection
    try {
      await alpacaService.getAccount();
      result.alpaca.status = 'healthy';
    } catch (error: any) {
      result.alpaca.error = error.message;
    }

    // Test Gemini connection
    try {
      if (geminiService.isConfigured()) {
        await geminiService.getBalances();
        result.gemini.status = 'healthy';
      } else {
        result.gemini.error = 'Gemini not configured';
      }
    } catch (error: any) {
      result.gemini.error = error.message;
    }

    return result;
  }

  // Get latest market data for a symbol from appropriate table
  async getLatestMarketData(symbol: string, assetType: 'stock' | 'crypto'): Promise<MarketDataSync | null> {
    if (!supabaseAdmin) {
      throw new Error('Database not available');
    }

    try {
      const table = assetType === 'stock' ? 'stock_data' : 'crypto_data';
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .eq('symbol', symbol)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      const record = data as any;
      return {
        symbol: record.symbol,
        assetType,
        price: record.price,
        volume: record.volume,
        timestamp: new Date(record.timestamp),
      };
    } catch (error: any) {
      throw new Error(`Failed to get market data: ${error.message}`);
    }
  }

  // Get historical market data for a symbol from appropriate table
  async getHistoricalMarketData(
    symbol: string, 
    assetType: 'stock' | 'crypto',
    fromDate: Date,
    toDate: Date
  ): Promise<MarketDataSync[]> {
    if (!supabaseAdmin) {
      throw new Error('Database not available');
    }

    try {
      const table = assetType === 'stock' ? 'stock_data' : 'crypto_data';
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .eq('symbol', symbol)
        .gte('timestamp', fromDate.toISOString())
        .lte('timestamp', toDate.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return (data || []).map((record: any) => ({
        symbol: record.symbol,
        assetType,
        price: record.price,
        volume: record.volume,
        timestamp: new Date(record.timestamp),
      }));
    } catch (error: any) {
      throw new Error(`Failed to get historical market data: ${error.message}`);
    }
  }

  // Cleanup old market data from both stock and crypto tables (keep last 30 days)
  async cleanupOldMarketData(): Promise<number> {
    if (!supabaseAdmin) {
      throw new Error('Database not available');
    }

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      let totalDeleted = 0;
      
      // Clean up stock data
      const { count: stockCount, error: stockError } = await supabaseAdmin
        .from('stock_data')
        .delete({ count: 'exact' })
        .lt('timestamp', thirtyDaysAgo.toISOString());

      if (stockError) throw stockError;
      totalDeleted += stockCount || 0;

      // Clean up crypto data
      const { count: cryptoCount, error: cryptoError } = await supabaseAdmin
        .from('crypto_data')
        .delete({ count: 'exact' })
        .lt('timestamp', thirtyDaysAgo.toISOString());

      if (cryptoError) throw cryptoError;
      totalDeleted += cryptoCount || 0;

      logger.info(`Cleaned up ${totalDeleted} old market data records`);
      
      return totalDeleted;
    } catch (error: any) {
      logger.error('Failed to cleanup old market data:', error);
      throw new Error(`Failed to cleanup old market data: ${error.message}`);
    }
  }
}

export const dataService = new DataService();