'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Activity, 
  Clock, 
  AlertTriangle, 
  Cpu, 
  HardDrive, 
  Wifi,
  MemoryStick
} from 'lucide-react';
import { RealTimeMetrics as RealTimeMetricsType } from '@/types/monitoring';

interface RealTimeMetricsProps {
  metrics: RealTimeMetricsType | null;
  isConnected: boolean;
  className?: string;
}

export function RealTimeMetrics({ metrics, isConnected, className }: RealTimeMetricsProps) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (metrics) {
      setLastUpdate(new Date());
    }
  }, [metrics]);

  const formatValue = (value: number, unit: string) => {
    if (unit === 'ms') return `${value.toFixed(0)}ms`;
    if (unit === '%') return `${value.toFixed(1)}%`;
    if (unit === 'rps') return `${value.toFixed(1)}/s`;
    return value.toFixed(0);
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-500';
    if (value >= thresholds.warning) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'bg-red-500';
    if (value >= thresholds.warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!metrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Metrics
            <Badge variant={isConnected ? 'default' : 'destructive'} className="ml-auto">
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            {isConnected ? 'Loading metrics...' : 'Connection lost. Retrying...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Real-time Metrics
          <Badge variant={isConnected ? 'default' : 'destructive'} className="ml-auto">
            {isConnected ? 'Live' : 'Disconnected'}
          </Badge>
        </CardTitle>
        {lastUpdate && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Activity */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-blue-500" />
              Active Users
            </div>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4 text-green-500" />
              Requests/sec
            </div>
            <div className="text-2xl font-bold">{formatValue(metrics.requestsPerSecond, 'rps')}</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Performance</h4>
          
          {/* Response Time */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                Response Time
              </div>
              <span className={`text-sm font-medium ${getStatusColor(metrics.averageResponseTime, { warning: 500, critical: 1000 })}`}>
                {formatValue(metrics.averageResponseTime, 'ms')}
              </span>
            </div>
            <Progress 
              value={Math.min((metrics.averageResponseTime / 1000) * 100, 100)} 
              className="h-2"
            />
          </div>

          {/* Error Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4" />
                Error Rate
              </div>
              <span className={`text-sm font-medium ${getStatusColor(metrics.errorRate, { warning: 1, critical: 5 })}`}>
                {formatValue(metrics.errorRate, '%')}
              </span>
            </div>
            <Progress 
              value={Math.min(metrics.errorRate, 10) * 10} 
              className="h-2"
            />
          </div>

          {/* Network Latency */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm">
                <Wifi className="h-4 w-4" />
                Network Latency
              </div>
              <span className={`text-sm font-medium ${getStatusColor(metrics.networkLatency, { warning: 100, critical: 200 })}`}>
                {formatValue(metrics.networkLatency, 'ms')}
              </span>
            </div>
            <Progress 
              value={Math.min((metrics.networkLatency / 200) * 100, 100)} 
              className="h-2"
            />
          </div>
        </div>

        {/* System Resources */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">System Resources</h4>
          
          {/* CPU Usage */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm">
                <Cpu className="h-4 w-4" />
                CPU Usage
              </div>
              <span className={`text-sm font-medium ${getStatusColor(metrics.cpuUsage, { warning: 70, critical: 90 })}`}>
                {formatValue(metrics.cpuUsage, '%')}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(metrics.cpuUsage, { warning: 70, critical: 90 })}`}
                style={{ width: `${Math.min(metrics.cpuUsage, 100)}%` }}
              />
            </div>
          </div>

          {/* Memory Usage */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm">
                <MemoryStick className="h-4 w-4" />
                Memory Usage
              </div>
              <span className={`text-sm font-medium ${getStatusColor(metrics.memoryUsage, { warning: 70, critical: 90 })}`}>
                {formatValue(metrics.memoryUsage, '%')}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(metrics.memoryUsage, { warning: 70, critical: 90 })}`}
                style={{ width: `${Math.min(metrics.memoryUsage, 100)}%` }}
              />
            </div>
          </div>

          {/* Disk Usage */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm">
                <HardDrive className="h-4 w-4" />
                Disk Usage
              </div>
              <span className={`text-sm font-medium ${getStatusColor(metrics.diskUsage, { warning: 80, critical: 95 })}`}>
                {formatValue(metrics.diskUsage, '%')}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(metrics.diskUsage, { warning: 80, critical: 95 })}`}
                style={{ width: `${Math.min(metrics.diskUsage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Overall Status</span>
            <Badge 
              variant={
                metrics.errorRate > 5 || metrics.cpuUsage > 90 || metrics.memoryUsage > 90 
                  ? 'destructive' 
                  : metrics.errorRate > 1 || metrics.cpuUsage > 70 || metrics.memoryUsage > 70
                  ? 'secondary'
                  : 'default'
              }
            >
              {metrics.errorRate > 5 || metrics.cpuUsage > 90 || metrics.memoryUsage > 90 
                ? 'Critical' 
                : metrics.errorRate > 1 || metrics.cpuUsage > 70 || metrics.memoryUsage > 70
                ? 'Warning'
                : 'Healthy'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
