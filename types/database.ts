export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          role: 'admin' | 'user' | 'viewer' | 'trader';
          email_verified: boolean;
          two_factor_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          role?: 'admin' | 'user' | 'viewer' | 'trader';
          email_verified?: boolean;
          two_factor_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar_url?: string | null;
          role?: 'admin' | 'user' | 'viewer' | 'trader';
          email_verified?: boolean;
          two_factor_enabled?: boolean;
          updated_at?: string;
        };
      };
      portfolios: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          total_value: number;
          cash_balance: number;
          is_active: boolean;
          risk_tolerance: 'low' | 'medium' | 'high';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          total_value?: number;
          cash_balance?: number;
          is_active?: boolean;
          risk_tolerance?: 'low' | 'medium' | 'high';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          total_value?: number;
          cash_balance?: number;
          is_active?: boolean;
          risk_tolerance?: 'low' | 'medium' | 'high';
          updated_at?: string;
        };
      };
      stock_data: {
        Row: {
          id: string;
          symbol: string;
          price: number;
          volume: number;
          timestamp: string;
          open: number;
          high: number;
          low: number;
          close: number;
          change: number;
          change_percent: number;
          market_cap: number | null;
          pe_ratio: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          symbol: string;
          price: number;
          volume: number;
          timestamp: string;
          open: number;
          high: number;
          low: number;
          close: number;
          change: number;
          change_percent: number;
          market_cap?: number | null;
          pe_ratio?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          symbol?: string;
          price?: number;
          volume?: number;
          timestamp?: string;
          open?: number;
          high?: number;
          low?: number;
          close?: number;
          change?: number;
          change_percent?: number;
          market_cap?: number | null;
          pe_ratio?: number | null;
        };
      };
      crypto_data: {
        Row: {
          id: string;
          symbol: string;
          price: number;
          volume: number;
          timestamp: string;
          high_24h: number;
          low_24h: number;
          change_24h: number;
          change_percent_24h: number;
          market_cap: number | null;
          circulating_supply: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          symbol: string;
          price: number;
          volume: number;
          timestamp: string;
          high_24h: number;
          low_24h: number;
          change_24h: number;
          change_percent_24h: number;
          market_cap?: number | null;
          circulating_supply?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          symbol?: string;
          price?: number;
          volume?: number;
          timestamp?: string;
          high_24h?: number;
          low_24h?: number;
          change_24h?: number;
          change_percent_24h?: number;
          market_cap?: number | null;
          circulating_supply?: number | null;
        };
      };
      technical_indicators: {
        Row: {
          id: string;
          symbol: string;
          asset_type: 'stock' | 'crypto';
          timestamp: string;
          indicators: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          symbol: string;
          asset_type: 'stock' | 'crypto';
          timestamp: string;
          indicators: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          symbol?: string;
          asset_type?: 'stock' | 'crypto';
          timestamp?: string;
          indicators?: Record<string, any>;
        };
      };
      trading_signals: {
        Row: {
          id: string;
          symbol: string;
          asset_type: 'stock' | 'crypto';
          action: 'buy' | 'sell' | 'hold';
          confidence: number;
          reasoning: string[];
          indicators: Record<string, any>;
          timestamp: string;
          target_price: number | null;
          stop_loss: number | null;
          take_profit: number | null;
          executed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          symbol: string;
          asset_type: 'stock' | 'crypto';
          action: 'buy' | 'sell' | 'hold';
          confidence: number;
          reasoning: string[];
          indicators: Record<string, any>;
          timestamp: string;
          target_price?: number | null;
          stop_loss?: number | null;
          take_profit?: number | null;
          executed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          symbol?: string;
          asset_type?: 'stock' | 'crypto';
          action?: 'buy' | 'sell' | 'hold';
          confidence?: number;
          reasoning?: string[];
          indicators?: Record<string, any>;
          timestamp?: string;
          target_price?: number | null;
          stop_loss?: number | null;
          take_profit?: number | null;
          executed?: boolean;
        };
      };
      trades: {
        Row: {
          id: string;
          portfolio_id: string;
          signal_id: string | null;
          symbol: string;
          asset_type: 'stock' | 'crypto';
          action: 'buy' | 'sell';
          quantity: number;
          price: number;
          total_value: number;
          fees: number;
          timestamp: string;
          status: 'pending' | 'filled' | 'partial' | 'cancelled' | 'failed';
          external_order_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          portfolio_id: string;
          signal_id?: string | null;
          symbol: string;
          asset_type: 'stock' | 'crypto';
          action: 'buy' | 'sell';
          quantity: number;
          price: number;
          total_value: number;
          fees?: number;
          timestamp: string;
          status: 'pending' | 'filled' | 'partial' | 'cancelled' | 'failed';
          external_order_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          portfolio_id?: string;
          signal_id?: string | null;
          symbol?: string;
          asset_type?: 'stock' | 'crypto';
          action?: 'buy' | 'sell';
          quantity?: number;
          price?: number;
          total_value?: number;
          fees?: number;
          timestamp?: string;
          status?: 'pending' | 'filled' | 'partial' | 'cancelled' | 'failed';
          external_order_id?: string | null;
          notes?: string | null;
        };
      };
      positions: {
        Row: {
          id: string;
          portfolio_id: string;
          symbol: string;
          asset_type: 'stock' | 'crypto';
          quantity: number;
          average_price: number;
          current_price: number;
          total_value: number;
          unrealized_pnl: number;
          realized_pnl: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          portfolio_id: string;
          symbol: string;
          asset_type: 'stock' | 'crypto';
          quantity: number;
          average_price: number;
          current_price: number;
          total_value?: number;
          unrealized_pnl?: number;
          realized_pnl?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          portfolio_id?: string;
          symbol?: string;
          asset_type?: 'stock' | 'crypto';
          quantity?: number;
          average_price?: number;
          current_price?: number;
          total_value?: number;
          unrealized_pnl?: number;
          realized_pnl?: number;
          updated_at?: string;
        };
      };
      performance_metrics: {
        Row: {
          id: string;
          portfolio_id: string;
          date: string;
          total_return: number;
          total_return_percent: number;
          daily_return: number;
          daily_return_percent: number;
          sharpe_ratio: number | null;
          max_drawdown: number | null;
          win_rate: number | null;
          profit_factor: number | null;
          total_trades: number;
          winning_trades: number;
          losing_trades: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          portfolio_id: string;
          date: string;
          total_return: number;
          total_return_percent: number;
          daily_return: number;
          daily_return_percent: number;
          sharpe_ratio?: number | null;
          max_drawdown?: number | null;
          win_rate?: number | null;
          profit_factor?: number | null;
          total_trades?: number;
          winning_trades?: number;
          losing_trades?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          portfolio_id?: string;
          date?: string;
          total_return?: number;
          total_return_percent?: number;
          daily_return?: number;
          daily_return_percent?: number;
          sharpe_ratio?: number | null;
          max_drawdown?: number | null;
          win_rate?: number | null;
          profit_factor?: number | null;
          total_trades?: number;
          winning_trades?: number;
          losing_trades?: number;
        };
      };
      watchlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          symbols: string[];
          asset_types: string[];
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          symbols: string[];
          asset_types: string[];
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          symbols?: string[];
          asset_types?: string[];
          is_default?: boolean;
          updated_at?: string;
        };
      };
      trading_strategies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          parameters: Record<string, any>;
          is_active: boolean;
          performance_stats: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          parameters: Record<string, any>;
          is_active?: boolean;
          performance_stats?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          parameters?: Record<string, any>;
          is_active?: boolean;
          performance_stats?: Record<string, any> | null;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_values: Record<string, any> | null;
          new_values: Record<string, any> | null;
          ip_address: string | null;
          user_agent: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_values?: Record<string, any> | null;
          new_values?: Record<string, any> | null;
          ip_address?: string | null;
          user_agent?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          old_values?: Record<string, any> | null;
          new_values?: Record<string, any> | null;
          ip_address?: string | null;
          user_agent?: string | null;
          timestamp?: string;
        };
      };
      security_logs: {
        Row: {
          id: string;
          user_id: string | null;
          event_type: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          description: string;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Record<string, any> | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          description: string;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Record<string, any> | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_type?: string;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          description?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Record<string, any> | null;
          timestamp?: string;
        };
      };
      system_logs: {
        Row: {
          id: string;
          level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
          message: string;
          service: string;
          metadata: Record<string, any> | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
          message: string;
          service: string;
          metadata?: Record<string, any> | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
          message?: string;
          service?: string;
          metadata?: Record<string, any> | null;
          timestamp?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_portfolio_performance: {
        Args: {
          portfolio_uuid: string;
        };
        Returns: {
          total_value: number;
          unrealized_pnl: number;
          realized_pnl: number;
          total_pnl: number;
          pnl_percentage: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}