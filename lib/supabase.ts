import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if we're in a server environment and missing required variables
if (typeof window === 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('Supabase environment variables not fully configured. Some features may be disabled.');
  console.warn('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.warn('Optional: SUPABASE_SERVICE_ROLE_KEY (required for admin operations)');
}

// Only create clients if we have the required configuration
const hasValidConfig = supabaseUrl && supabaseAnonKey;

// Client for browser usage (with RLS)
export const supabase = hasValidConfig ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    storageKey: 'ai-trader-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'ai-trader-web',
    },
  },
}) : null;

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = (hasValidConfig && supabaseServiceKey)
  ? createClient<Database>(supabaseUrl!, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'X-Client-Info': 'ai-trader-admin',
        },
      },
    })
  : null;

// Types for better TypeScript support
export type SupabaseClient = typeof supabase;
export type SupabaseUser = Database['public']['Tables']['users']['Row'];
export type SupabasePortfolio = Database['public']['Tables']['portfolios']['Row'];
export type SupabasePosition = Database['public']['Tables']['positions']['Row'];
export type SupabaseTrade = Database['public']['Tables']['trades']['Row'];
export type SupabaseSignal = Database['public']['Tables']['trading_signals']['Row'];

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any): never {
  console.error('Supabase error:', error);
  throw new Error(error.message || 'Database operation failed');
}

// Helper function to check if user is authenticated
export async function requireAuth() {
  if (!supabase) {
    throw new Error('Supabase not configured - authentication unavailable');
  }
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

// Real-time subscription helpers
export function subscribeToPortfolioChanges(
  portfolioId: string,
  callback: (payload: any) => void
) {
  if (!supabase) {
    throw new Error('Supabase not configured - real-time subscriptions unavailable');
  }
  
  return supabase
    .channel(`portfolio:${portfolioId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'positions',
        filter: `portfolio_id=eq.${portfolioId}`,
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trades',
        filter: `portfolio_id=eq.${portfolioId}`,
      },
      callback
    )
    .subscribe();
}

export function subscribeToTradingSignals(callback: (payload: any) => void) {
  if (!supabase) {
    throw new Error('Supabase not configured - real-time subscriptions unavailable');
  }
  
  return supabase
    .channel('trading-signals')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'trading_signals',
      },
      callback
    )
    .subscribe();
}

export function subscribeToMarketData(
  symbols: string[],
  callback: (payload: any) => void
) {
  if (!supabase) {
    throw new Error('Supabase not configured - real-time subscriptions unavailable');
  }
  
  const symbolFilter = symbols.map(s => `symbol=eq.${s}`).join(',');
  
  return supabase
    .channel('market-data')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'stock_data',
        filter: `or(${symbolFilter})`,
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'crypto_data',
        filter: `or(${symbolFilter})`,
      },
      callback
    )
    .subscribe();
}

// Database query helpers
export class DatabaseQueries {
  static async getUserPortfolios(userId: string) {
    if (!supabase) {
      throw new Error('Supabase not configured - database queries unavailable');
    }
    
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error);
    return data || [];
  }

  static async getPortfolioPositions(portfolioId: string) {
    if (!supabase) {
      throw new Error('Supabase not configured - database queries unavailable');
    }
    
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('total_value', { ascending: false });

    if (error) handleSupabaseError(error);
    return data || [];
  }

  static async getRecentTrades(portfolioId: string, limit = 50) {
    if (!supabase) {
      throw new Error('Supabase not configured - database queries unavailable');
    }
    
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) handleSupabaseError(error);
    return data || [];
  }

  static async getActiveTradingSignals(limit = 20) {
    if (!supabase) {
      throw new Error('Supabase not configured - database queries unavailable');
    }
    
    const { data, error } = await supabase
      .from('trading_signals')
      .select('*')
      .eq('executed', false)
      .gte('confidence', 0.6)
      .order('confidence', { ascending: false })
      .limit(limit);

    if (error) handleSupabaseError(error);
    return data || [];
  }

  static async getLatestMarketData(symbols: string[], assetType: 'stock' | 'crypto') {
    if (!supabase) {
      throw new Error('Supabase not configured - database queries unavailable');
    }
    
    const table = assetType === 'stock' ? 'stock_data' : 'crypto_data';
    
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .in('symbol', symbols)
      .order('timestamp', { ascending: false })
      .limit(symbols.length);

    if (error) handleSupabaseError(error);
    return data || [];
  }

  static async getUserWatchlists(userId: string) {
    if (!supabase) {
      throw new Error('Supabase not configured - database queries unavailable');
    }
    
    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) handleSupabaseError(error);
    return data || [];
  }

  static async getPortfolioPerformance(portfolioId: string, days = 30) {
    if (!supabase) {
      throw new Error('Supabase not configured - database queries unavailable');
    }
    
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) handleSupabaseError(error);
    return data || [];
  }
}