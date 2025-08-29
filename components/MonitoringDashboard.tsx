'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Activity, 
  Database, 
  Server, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    alpaca: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    gemini: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    scheduler: {
      status: 'healthy' | 'unhealthy';
      activeJobs?: number;
      error?: string;
    };
  };
  timestamp: string;
  uptime: number;
}

interface SchedulerStatus {
  status: Record<string, {
    name: string;
    status: 'active' | 'inactive' | 'error';
    lastRun?: Date;
    nextRun?: Date;
  }>;
  isInitialized: boolean;
}

export default function MonitoringDashboard() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthStatus(data);
    } catch (error) {
      console.error('Failed to fetch health status:', error);
    }
  };

  const fetchSchedulerStatus = async () => {
    try {
      const response = await fetch('/api/admin/scheduler');
      const data = await response.json();
      setSchedulerStatus(data.data);
    } catch (error) {
      console.error('Failed to fetch scheduler status:', error);
    }
  };

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      fetchHealthStatus(),
      fetchSchedulerStatus()
    ]);
    setLastUpdate(new Date());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, refreshData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unhealthy':
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatResponseTime = (ms?: number) => {
    if (!ms) return 'N/A';
    return `${ms}ms`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time system health and performance monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {lastUpdate && `Last updated: ${lastUpdate.toLocaleTimeString()}`}
          </div>
          
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          
          <Button
            onClick={refreshData}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      {healthStatus && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(healthStatus.status)}
                <div>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>
                    Overall system status and uptime
                  </CardDescription>
                </div>
              </div>
              <Badge className={getStatusColor(healthStatus.status)}>
                {healthStatus.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold">
                  {formatUptime(healthStatus.uptime)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Check</p>
                <p className="text-lg">
                  {new Date(healthStatus.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Component Health Checks */}
      {healthStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Database */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  <CardTitle className="text-lg">Database</CardTitle>
                </div>
                {getStatusIcon(healthStatus.checks.database.status)}
              </div>
            </CardHeader>
            <CardContent>
              <Badge className={getStatusColor(healthStatus.checks.database.status)}>
                {healthStatus.checks.database.status}
              </Badge>
              {healthStatus.checks.database.responseTime && (
                <p className="text-sm text-muted-foreground mt-2">
                  Response: {formatResponseTime(healthStatus.checks.database.responseTime)}
                </p>
              )}
              {healthStatus.checks.database.error && (
                <p className="text-sm text-red-600 mt-2">
                  {healthStatus.checks.database.error}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Alpaca API */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  <CardTitle className="text-lg">Alpaca</CardTitle>
                </div>
                {getStatusIcon(healthStatus.checks.alpaca.status)}
              </div>
            </CardHeader>
            <CardContent>
              <Badge className={getStatusColor(healthStatus.checks.alpaca.status)}>
                {healthStatus.checks.alpaca.status}
              </Badge>
              {healthStatus.checks.alpaca.responseTime && (
                <p className="text-sm text-muted-foreground mt-2">
                  Response: {formatResponseTime(healthStatus.checks.alpaca.responseTime)}
                </p>
              )}
              {healthStatus.checks.alpaca.error && (
                <p className="text-sm text-red-600 mt-2">
                  {healthStatus.checks.alpaca.error}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Gemini API */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  <CardTitle className="text-lg">Gemini</CardTitle>
                </div>
                {getStatusIcon(healthStatus.checks.gemini.status)}
              </div>
            </CardHeader>
            <CardContent>
              <Badge className={getStatusColor(healthStatus.checks.gemini.status)}>
                {healthStatus.checks.gemini.status}
              </Badge>
              {healthStatus.checks.gemini.responseTime && (
                <p className="text-sm text-muted-foreground mt-2">
                  Response: {formatResponseTime(healthStatus.checks.gemini.responseTime)}
                </p>
              )}
              {healthStatus.checks.gemini.error && (
                <p className="text-sm text-red-600 mt-2">
                  {healthStatus.checks.gemini.error}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Scheduler */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <CardTitle className="text-lg">Scheduler</CardTitle>
                </div>
                {getStatusIcon(healthStatus.checks.scheduler.status)}
              </div>
            </CardHeader>
            <CardContent>
              <Badge className={getStatusColor(healthStatus.checks.scheduler.status)}>
                {healthStatus.checks.scheduler.status}
              </Badge>
              {healthStatus.checks.scheduler.activeJobs !== undefined && (
                <p className="text-sm text-muted-foreground mt-2">
                  Active Jobs: {healthStatus.checks.scheduler.activeJobs}
                </p>
              )}
              {healthStatus.checks.scheduler.error && (
                <p className="text-sm text-red-600 mt-2">
                  {healthStatus.checks.scheduler.error}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scheduler Jobs */}
      {schedulerStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Scheduler Jobs
            </CardTitle>
            <CardDescription>
              Status of automated background jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(schedulerStatus.status || {}).map(([jobId, job]) => (
                <div key={jobId} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{job.name}</h4>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </div>
                  
                  {job.lastRun && (
                    <p className="text-xs text-muted-foreground">
                      Last: {new Date(job.lastRun).toLocaleString()}
                    </p>
                  )}
                  
                  {job.nextRun && (
                    <p className="text-xs text-muted-foreground">
                      Next: {new Date(job.nextRun).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
