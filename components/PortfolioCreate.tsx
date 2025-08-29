'use client';

import { useState } from 'react';
import { Plus, DollarSign, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  cashBalance: number;
  totalValue: number;
  totalPnL: number;
  createdAt: Date;
}

interface PortfolioCreateProps {
  onPortfolioCreated: (portfolio: Portfolio) => void;
  onCancel: () => void;
}

export default function PortfolioCreate({ onPortfolioCreated, onCancel }: PortfolioCreateProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    initialCash: '100000',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          initialCash: parseFloat(formData.initialCash),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create portfolio');
      }

      const data = await response.json();
      onPortfolioCreated(data.data.portfolio);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create New Portfolio
        </CardTitle>
        <CardDescription>
          Set up a new trading portfolio with initial cash balance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Portfolio Name *
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleInputChange}
              placeholder="My Trading Portfolio"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Optional description for this portfolio"
              rows={3}
              className={cn(
                "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              )}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="initialCash" className="text-sm font-medium">
              Initial Cash Balance *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="initialCash"
                name="initialCash"
                type="number"
                required
                min="1000"
                step="100"
                value={formData.initialCash}
                onChange={handleInputChange}
                placeholder="100000"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum $1,000 required to start trading
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !formData.name.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Portfolio'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}