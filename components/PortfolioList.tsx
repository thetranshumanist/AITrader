'use client';

import { useState, useEffect } from 'react';
import { Briefcase, Plus, TrendingUp, TrendingDown, Settings, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import PortfolioCreate from './PortfolioCreate';

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  cashBalance: number;
  totalValue: number;
  totalPnL: number;
  createdAt: Date;
}

interface PortfolioListProps {
  onSelectPortfolio: (portfolioId: string) => void;
  selectedPortfolioId?: string;
}

export default function PortfolioList({ onSelectPortfolio, selectedPortfolioId }: PortfolioListProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/portfolio');
      
      if (!response.ok) {
        throw new Error('Failed to fetch portfolios');
      }

      const data = await response.json();
      setPortfolios(data.data.portfolios || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortfolioCreated = (newPortfolio: Portfolio) => {
    setPortfolios(prev => [newPortfolio, ...prev]);
    setShowCreateForm(false);
    onSelectPortfolio(newPortfolio.id);
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    if (!confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/portfolio?portfolioId=${portfolioId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete portfolio');
      }

      setPortfolios(prev => prev.filter(p => p.id !== portfolioId));
      
      if (selectedPortfolioId === portfolioId) {
        const remainingPortfolios = portfolios.filter(p => p.id !== portfolioId);
        if (remainingPortfolios.length > 0) {
          onSelectPortfolio(remainingPortfolios[0].id);
        }
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (showCreateForm) {
    return (
      <PortfolioCreate
        onPortfolioCreated={handlePortfolioCreated}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Portfolios</h2>
          <p className="text-muted-foreground">Manage and monitor your trading portfolios</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Portfolio
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center p-4">
            <span className="text-red-700">{error}</span>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : portfolios.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No portfolios yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first portfolio to start automated trading
            </p>
            <Button onClick={() => setShowCreateForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Portfolio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => {
            const isSelected = selectedPortfolioId === portfolio.id;
            const pnlPercentage = portfolio.cashBalance > 0 
              ? (portfolio.totalPnL / portfolio.cashBalance) * 100 
              : 0;

            return (
              <Card 
                key={portfolio.id} 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isSelected && "ring-2 ring-primary border-primary"
                )}
                onClick={() => onSelectPortfolio(portfolio.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">{portfolio.name}</CardTitle>
                      {portfolio.description && (
                        <CardDescription className="line-clamp-2">
                          {portfolio.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {isSelected && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePortfolio(portfolio.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Value</span>
                    <span className="font-semibold">{formatCurrency(portfolio.totalValue)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">P&L</span>
                    <div className="flex items-center gap-1">
                      {portfolio.totalPnL >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={cn(
                        "font-semibold",
                        portfolio.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatCurrency(portfolio.totalPnL)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Return</span>
                    <span className={cn(
                      "text-sm font-medium",
                      pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatPercent(pnlPercentage)}
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Created</span>
                      <span>{new Date(portfolio.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}