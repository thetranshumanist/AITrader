-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret';

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer', 'trader')),
  email_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolios table
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  total_value DECIMAL(20,8) DEFAULT 0,
  cash_balance DECIMAL(20,8) DEFAULT 10000,
  is_active BOOLEAN DEFAULT TRUE,
  risk_tolerance TEXT DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock data table
CREATE TABLE IF NOT EXISTS public.stock_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol TEXT NOT NULL,
  price DECIMAL(15,4) NOT NULL,
  volume BIGINT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  open DECIMAL(15,4) NOT NULL,
  high DECIMAL(15,4) NOT NULL,
  low DECIMAL(15,4) NOT NULL,
  close DECIMAL(15,4) NOT NULL,
  change DECIMAL(15,4) NOT NULL,
  change_percent DECIMAL(8,4) NOT NULL,
  market_cap BIGINT,
  pe_ratio DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crypto data table
CREATE TABLE IF NOT EXISTS public.crypto_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol TEXT NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  volume DECIMAL(20,8) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  high_24h DECIMAL(20,8) NOT NULL,
  low_24h DECIMAL(20,8) NOT NULL,
  change_24h DECIMAL(20,8) NOT NULL,
  change_percent_24h DECIMAL(8,4) NOT NULL,
  market_cap DECIMAL(20,8),
  circulating_supply DECIMAL(20,8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Technical indicators table
CREATE TABLE IF NOT EXISTS public.technical_indicators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'crypto')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  indicators JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol, asset_type, timestamp)
);

-- Trading signals table
CREATE TABLE IF NOT EXISTS public.trading_signals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'crypto')),
  action TEXT NOT NULL CHECK (action IN ('buy', 'sell', 'hold')),
  confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT[] NOT NULL,
  indicators JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  target_price DECIMAL(20,8),
  stop_loss DECIMAL(20,8),
  take_profit DECIMAL(20,8),
  executed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trades table
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
  signal_id UUID REFERENCES public.trading_signals(id),
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'crypto')),
  action TEXT NOT NULL CHECK (action IN ('buy', 'sell')),
  quantity DECIMAL(20,8) NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  total_value DECIMAL(20,8) NOT NULL,
  fees DECIMAL(20,8) DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'filled', 'partial', 'cancelled', 'failed')),
  external_order_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Positions table
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'crypto')),
  quantity DECIMAL(20,8) NOT NULL,
  average_price DECIMAL(20,8) NOT NULL,
  current_price DECIMAL(20,8) NOT NULL,
  total_value DECIMAL(20,8) NOT NULL,
  unrealized_pnl DECIMAL(20,8) DEFAULT 0,
  realized_pnl DECIMAL(20,8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(portfolio_id, symbol, asset_type)
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_return DECIMAL(20,8) NOT NULL,
  total_return_percent DECIMAL(8,4) NOT NULL,
  daily_return DECIMAL(20,8) NOT NULL,
  daily_return_percent DECIMAL(8,4) NOT NULL,
  sharpe_ratio DECIMAL(8,4),
  max_drawdown DECIMAL(8,4),
  win_rate DECIMAL(5,4),
  profit_factor DECIMAL(8,4),
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(portfolio_id, date)
);

-- Watchlist table
CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  symbols TEXT[] NOT NULL,
  asset_types TEXT[] NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading strategies table
CREATE TABLE IF NOT EXISTS public.trading_strategies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  parameters JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  performance_stats JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security logs table
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System logs table
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  message TEXT NOT NULL,
  service TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_data_symbol_timestamp ON public.stock_data(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_data_symbol_timestamp ON public.crypto_data(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_technical_indicators_symbol_timestamp ON public.technical_indicators(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol_timestamp ON public.trading_signals(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trading_signals_executed ON public.trading_signals(executed, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trades_portfolio_timestamp ON public.trades(portfolio_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trades_symbol_timestamp ON public.trades(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_positions_portfolio ON public.positions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_portfolio_date ON public.performance_metrics(portfolio_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_strategies_user_id ON public.trading_strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON public.audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_timestamp ON public.security_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level_timestamp ON public.system_logs(level, timestamp DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_stock_data_symbol_date ON public.stock_data(symbol, DATE(timestamp));
CREATE INDEX IF NOT EXISTS idx_crypto_data_symbol_date ON public.crypto_data(symbol, DATE(timestamp));
CREATE INDEX IF NOT EXISTS idx_trades_portfolio_status ON public.trades(portfolio_id, status);
CREATE INDEX IF NOT EXISTS idx_positions_portfolio_asset_type ON public.positions(portfolio_id, asset_type);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own portfolios" ON public.portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own portfolios" ON public.portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portfolios" ON public.portfolios FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own trades" ON public.trades FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.portfolios WHERE id = portfolio_id));
CREATE POLICY "System can insert trades" ON public.trades FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own positions" ON public.positions FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.portfolios WHERE id = portfolio_id));
CREATE POLICY "System can manage positions" ON public.positions FOR ALL WITH CHECK (true);

CREATE POLICY "Users can view own performance" ON public.performance_metrics FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.portfolios WHERE id = portfolio_id));
CREATE POLICY "System can insert performance" ON public.performance_metrics FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage own watchlists" ON public.watchlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own strategies" ON public.trading_strategies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);

-- Public access for market data (read-only)
CREATE POLICY "Public read access to stock data" ON public.stock_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read access to crypto data" ON public.crypto_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read access to technical indicators" ON public.technical_indicators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read access to trading signals" ON public.trading_signals FOR SELECT TO authenticated USING (true);

-- System access for data insertion
CREATE POLICY "System can insert stock data" ON public.stock_data FOR INSERT WITH CHECK (true);
CREATE POLICY "System can insert crypto data" ON public.crypto_data FOR INSERT WITH CHECK (true);
CREATE POLICY "System can insert technical indicators" ON public.technical_indicators FOR INSERT WITH CHECK (true);
CREATE POLICY "System can insert trading signals" ON public.trading_signals FOR INSERT WITH CHECK (true);

-- Functions for updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at_portfolios BEFORE UPDATE ON public.portfolios FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at_positions BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at_watchlists BEFORE UPDATE ON public.watchlists FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at_trading_strategies BEFORE UPDATE ON public.trading_strategies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to calculate portfolio performance
CREATE OR REPLACE FUNCTION public.calculate_portfolio_performance(portfolio_uuid UUID)
RETURNS TABLE (
  total_value DECIMAL(20,8),
  unrealized_pnl DECIMAL(20,8),
  realized_pnl DECIMAL(20,8),
  total_pnl DECIMAL(20,8),
  pnl_percentage DECIMAL(8,4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.cash_balance + COALESCE(SUM(pos.total_value), 0) as total_value,
    COALESCE(SUM(pos.unrealized_pnl), 0) as unrealized_pnl,
    COALESCE(SUM(pos.realized_pnl), 0) as realized_pnl,
    COALESCE(SUM(pos.unrealized_pnl + pos.realized_pnl), 0) as total_pnl,
    CASE 
      WHEN p.cash_balance + COALESCE(SUM(pos.total_value), 0) > 0 
      THEN (COALESCE(SUM(pos.unrealized_pnl + pos.realized_pnl), 0) / (p.cash_balance + COALESCE(SUM(pos.total_value), 0)) * 100)
      ELSE 0
    END as pnl_percentage
  FROM public.portfolios p
  LEFT JOIN public.positions pos ON p.id = pos.portfolio_id
  WHERE p.id = portfolio_uuid
  GROUP BY p.id, p.cash_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to update position values
CREATE OR REPLACE FUNCTION public.update_position_values()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_value = NEW.quantity * NEW.current_price;
  NEW.unrealized_pnl = (NEW.current_price - NEW.average_price) * NEW.quantity;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate position values
CREATE TRIGGER trigger_update_position_values
  BEFORE INSERT OR UPDATE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION public.update_position_values();

-- Create default portfolio for new users
CREATE OR REPLACE FUNCTION public.create_default_portfolio()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.portfolios (user_id, name, description)
  VALUES (NEW.id, 'Default Portfolio', 'Your main trading portfolio');
  
  INSERT INTO public.watchlists (user_id, name, symbols, asset_types, is_default)
  VALUES (NEW.id, 'Default Watchlist', ARRAY['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'BTC-USD', 'ETH-USD'], ARRAY['stock', 'stock', 'stock', 'stock', 'crypto', 'crypto'], true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default portfolio for new users
CREATE TRIGGER trigger_create_default_portfolio
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_portfolio();