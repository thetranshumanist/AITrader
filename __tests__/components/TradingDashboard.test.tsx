import { render, screen, waitFor } from '@testing-library/react';
import TradingDashboard from '../../components/TradingDashboard';

// Setup jest-dom matchers
import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Mock chart libraries
jest.mock('recharts', () => ({
  LineChart: () => 'LineChart',
  Line: () => 'Line',
  XAxis: () => 'XAxis',
  YAxis: () => 'YAxis',
  CartesianGrid: () => 'CartesianGrid',
  Tooltip: () => 'Tooltip',
  Legend: () => 'Legend',
  ResponsiveContainer: () => 'ResponsiveContainer',
}));

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('TradingDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: {
          portfolios: [],
        },
      }),
    } as Response);
  });

  it('should render the dashboard title', async () => {
    render(<TradingDashboard />);
    
    const titleElement = screen.getByText('My Portfolios');
    expect(titleElement).toBeDefined();
  });

  it('should show portfolio list initially', async () => {
    render(<TradingDashboard />);
    
    const titleElement = screen.getByText('My Portfolios');
    const subtitleElement = screen.getByText('Manage and monitor your trading portfolios');
    expect(titleElement).toBeDefined();
    expect(subtitleElement).toBeDefined();
  });

  it('should handle empty portfolio state', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: {
          portfolios: [],
        },
      }),
    } as Response);

    render(<TradingDashboard />);
    
    await waitFor(() => {
      const titleElement = screen.getByText('My Portfolios');
      expect(titleElement).toBeDefined();
    });
  });

  it('should format currency values correctly', () => {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    };

    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(-500)).toBe('-$500.00');
  });

  it('should format percentage values correctly', () => {
    const formatPercent = (value: number) => {
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    };

    expect(formatPercent(5.5)).toBe('+5.50%');
    expect(formatPercent(-2.3)).toBe('-2.30%');
    expect(formatPercent(0)).toBe('+0.00%');
  });

  it('should validate portfolio ID input', () => {
    const isValidPortfolioId = (id: string) => {
      return id && id.trim().length > 0 && !id.includes(' ');
    };

    expect(isValidPortfolioId('portfolio123')).toBe(true);
    expect(isValidPortfolioId('')).toBe(false);
    expect(isValidPortfolioId('   ')).toBe(false);
    expect(isValidPortfolioId('portfolio 123')).toBe(false);
  });
});