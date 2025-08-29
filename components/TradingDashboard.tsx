'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  Activity,
  AlertCircle,
  Loader2,
  PlayCircle,
  PauseCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import PortfolioList from './PortfolioList';

interface PortfolioMetrics {
  totalValue: number;
  totalCash: number;
  totalInvested: number;
  unrealizedPnL: number;
  realizedPnL: number;
  dayChange: number;
  dayChangePercent: number;
  openPositions: number;
  todayTrades: number;
}

interface Position {
  id: string;
  symbol: string;
  assetType: 'stock' | 'crypto';
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

interface TradeResult {
  processed: number;
  executed: number;
  failed: number;
  results: Array<{
    symbol: string;
    success: boolean;
    error?: string;
    orderId?: string;
  }>;
}

export default function TradingDashboard() {
  const [portfolioId, setPortfolioId] = useState('');
  const [showPortfolioList, setShowPortfolioList] = useState(true);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [automatedTradingActive, setAutomatedTradingActive] = useState(false);
  const [lastTradeResult, setLastTradeResult] = useState<TradeResult | null>(null);

  const handlePortfolioSelect = (selectedPortfolioId: string) => {
    setPortfolioId(selectedPortfolioId);
    setShowPortfolioList(false);
    // Auto-fetch data when portfolio is selected
    setTimeout(() => {
      fetchPortfolioData();
    }, 100);
  };

  const fetchPortfolioData = useCallback(async () => {
    if (!portfolioId) return;

    setIsLoading(true);
    setError('');

    try {
      // Fetch portfolio metrics
      const metricsResponse = await fetch(`/api/trading/execute?portfolioId=${portfolioId}`);
      if (!metricsResponse.ok) {
        throw new Error('Failed to fetch portfolio metrics');
      }
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData.data);

      // Fetch positions
      const positionsResponse = await fetch(`/api/portfolio/positions?portfolioId=${portfolioId}`);
      if (!positionsResponse.ok) {
        throw new Error('Failed to fetch positions');
      }
      const positionsData = await positionsResponse.json();
      setPositions(positionsData.data.positions);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [portfolioId]);

  const runAutomatedTrading = async () => {
    if (!portfolioId) {
      setError('Please enter a portfolio ID');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/trading/automated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ portfolioId }),
      });

      if (!response.ok) {
        throw new Error('Failed to run automated trading');
      }

      const data = await response.json();
      setLastTradeResult(data.data);
      
      // Refresh portfolio data after trading
      await fetchPortfolioData();
      
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const executeManualTrade = async (tradeData: any) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/trading/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...tradeData,
          portfolioId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute trade');
      }

      const data = await response.json();
      
      // Refresh portfolio data after trade
      await fetchPortfolioData();
      
      return data;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (portfolioId) {
      fetchPortfolioData();
    }
  }, [portfolioId, fetchPortfolioData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {showPortfolioList ? (
        <PortfolioList 
          onSelectPortfolio={handlePortfolioSelect}
          selectedPortfolioId={portfolioId}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trading Dashboard</h1>
              <Button 
                variant="ghost" 
                onClick={() => setShowPortfolioList(true)}
                className="text-sm text-muted-foreground hover:text-foreground p-0"
              >
                ← Back to Portfolios
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <Input
                type="text"
                placeholder="Portfolio ID"
                value={portfolioId}
                onChange={(e) => setPortfolioId(e.target.value)}
                className="w-48"
              />
              <Button
                onClick={fetchPortfolioData}
                disabled={isLoading || !portfolioId}
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center p-4">
            <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(metrics.totalValue)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Day Change</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    metrics.dayChange >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatCurrency(metrics.dayChange)}
                  </p>
                  <p className={cn(
                    "text-sm",
                    metrics.dayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatPercent(metrics.dayChangePercent)}
                  </p>
                </div>
                {metrics.dayChange >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-green-600" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-600" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unrealized P&L</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    metrics.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatCurrency(metrics.unrealizedPnL)}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Open Positions</p>
                  <p className="text-2xl font-bold">
                    {metrics.openPositions}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {metrics.todayTrades} trades today
                  </p>
                </div>
                <Activity className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Automated Trading Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Automated Trading</CardTitle>
            <div className="flex items-center space-x-4">
              <Badge 
                variant={automatedTradingActive ? "success" : "secondary"}
                className="flex items-center gap-2"
              >
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  automatedTradingActive ? 'bg-green-600' : 'bg-gray-600'
                )} />
                {automatedTradingActive ? 'Active' : 'Inactive'}
              </Badge>
              <Button
                onClick={runAutomatedTrading}
                disabled={isLoading || !portfolioId}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <PlayCircle className="w-4 h-4 mr-2" />
                )}
                Run Automated Trading
              </Button>
            </div>
          </div>
        </CardHeader>

        {lastTradeResult && (
          <CardContent className="border-t">
            <div className="pt-6">
              <h3 className="font-medium text-foreground mb-4">Last Trading Session Results</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{lastTradeResult.processed}</p>
                  <p className="text-sm text-muted-foreground">Signals Processed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{lastTradeResult.executed}</p>
                  <p className="text-sm text-muted-foreground">Trades Executed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{lastTradeResult.failed}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
              
              {lastTradeResult.results.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-muted-foreground">Trade Results:</h4>
                  {lastTradeResult.results.slice(0, 5).map((result, index) => (
                    <div key={index} className="flex items-center justify-between text-sm py-2 px-3 bg-muted rounded">
                      <span className="font-medium">{result.symbol}</span>
                      <Badge variant={result.success ? 'success' : 'destructive'}>
                        {result.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Positions Table */}
      {positions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Positions</CardTitle>
            <CardDescription>
              Overview of all open positions with real-time P&L
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Avg Price</TableHead>
                  <TableHead>Current Price</TableHead>
                  <TableHead>Market Value</TableHead>
                  <TableHead>P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium">
                      {position.symbol}
                    </TableCell>
                    <TableCell>
                      <Badge variant={position.assetType === 'stock' ? 'default' : 'secondary'}>
                        {position.assetType}
                      </Badge>
                    </TableCell>
                    <TableCell>{position.quantity}</TableCell>
                    <TableCell>{formatCurrency(position.averagePrice)}</TableCell>
                    <TableCell>{formatCurrency(position.currentPrice)}</TableCell>
                    <TableCell>{formatCurrency(position.marketValue)}</TableCell>
                    <TableCell>
                      <div className={cn(
                        position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        <div>{formatCurrency(position.unrealizedPnL)}</div>
                        <div className="text-xs">
                          {formatPercent(position.unrealizedPnLPercent)}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <span className="text-muted-foreground">Loading...</span>
          </CardContent>
        </Card>
      )}
        </>
      )}
    </div>
  );
}