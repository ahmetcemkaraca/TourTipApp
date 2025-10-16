'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { SystemHealth } from '@/types/monitoring';

interface SystemHealthCardProps {
  health: SystemHealth;
  className?: string;
}

export function SystemHealthCard({ health, className }: SystemHealthCardProps) {
  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'down':
        return 'text-red-500 bg-red-50 border-red-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const formatUptime = (uptime?: number) => {
    if (uptime === undefined) return 'N/A';
    return `${uptime.toFixed(1)}%`;
  };

  const formatResponseTime = (responseTime?: number) => {
    if (responseTime === undefined) return 'N/A';
    return `${responseTime.toFixed(0)}ms`;
  };

  const formatErrorRate = (errorRate?: number) => {
    if (errorRate === undefined) return 'N/A';
    return `${errorRate.toFixed(2)}%`;
  };

  return (
    <Card className={`${className} ${getStatusColor()}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium capitalize flex items-center gap-2">
          {getStatusIcon()}
          {health.service}
        </CardTitle>
        <Badge 
          variant={health.status === 'healthy' ? 'default' : 'destructive'}
          className="capitalize"
        >
          {health.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-gray-600">Uptime</div>
            <div className="font-semibold">{formatUptime(health.uptime)}</div>
          </div>
          <div>
            <div className="text-gray-600">Response</div>
            <div className="font-semibold">{formatResponseTime(health.responseTime)}</div>
          </div>
          <div>
            <div className="text-gray-600">Errors</div>
            <div className="font-semibold">{formatErrorRate(health.errorRate)}</div>
          </div>
        </div>
        
        {health.details && (
          <div className="text-xs text-gray-600">
            <div className="font-medium mb-1">Details:</div>
            <div className="bg-white/50 p-2 rounded border text-xs">
              {typeof health.details === 'string' 
                ? health.details 
                : JSON.stringify(health.details, null, 2)
              }
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Last check: {health.lastCheck?.toDate?.()?.toLocaleTimeString() || 'Unknown'}
        </div>
      </CardContent>
    </Card>
  );
}
