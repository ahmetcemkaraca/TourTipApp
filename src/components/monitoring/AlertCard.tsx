'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Info, Zap, CheckCircle, Clock } from 'lucide-react';
import { Alert } from '@/types/monitoring';

interface AlertCardProps {
  alert: Alert;
  onResolve?: (alertId: string) => void;
  onAssign?: (alertId: string) => void;
  className?: string;
}

export function AlertCard({ alert, onResolve, onAssign, className }: AlertCardProps) {
  const getLevelIcon = () => {
    switch (alert.level) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'critical':
        return <Zap className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelColor = () => {
    switch (alert.level) {
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'critical':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = () => {
    switch (alert.status) {
      case 'normal':
        return <Badge variant="default" className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'warning':
        return <Badge variant="destructive">Active</Badge>;
      case 'critical':
        return <Badge variant="destructive" className="bg-red-600">Critical</Badge>;
      default:
        return <Badge variant="secondary">{alert.status}</Badge>;
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getTimeSince = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  return (
    <Card className={`${className} ${getLevelColor()}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-start gap-2 flex-1">
          {getLevelIcon()}
          <div className="flex-1">
            <CardTitle className="text-sm font-medium">{alert.title}</CardTitle>
            <div className="text-xs text-gray-600 mt-1">{alert.service}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge()}
          <Badge variant="outline" className="text-xs capitalize">
            {alert.level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-700">{alert.description}</p>
        
        {(alert.metricName || alert.threshold || alert.currentValue) && (
          <div className="bg-white/50 p-3 rounded border">
            <div className="text-xs text-gray-600 mb-2">Metric Details:</div>
            <div className="grid grid-cols-1 gap-2 text-xs">
              {alert.metricName && (
                <div>
                  <span className="font-medium">Metric:</span> {alert.metricName}
                </div>
              )}
              {alert.threshold !== undefined && (
                <div>
                  <span className="font-medium">Threshold:</span> {alert.threshold}
                </div>
              )}
              {alert.currentValue !== undefined && (
                <div>
                  <span className="font-medium">Current Value:</span> {alert.currentValue}
                </div>
              )}
            </div>
          </div>
        )}

        {alert.tags && alert.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {alert.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatTime(alert.triggeredAt)} ({getTimeSince(alert.triggeredAt)})</span>
          </div>
          {alert.resolvedAt && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span>Resolved {getTimeSince(alert.resolvedAt)}</span>
            </div>
          )}
        </div>

        {alert.assignedTo && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Assigned to:</span> {alert.assignedTo}
          </div>
        )}

        {alert.status !== 'normal' && (
          <div className="flex gap-2 pt-2">
            {onResolve && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onResolve(alert.id)}
                className="text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Resolve
              </Button>
            )}
            {onAssign && !alert.assignedTo && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onAssign(alert.id)}
                className="text-xs"
              >
                Assign to me
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
