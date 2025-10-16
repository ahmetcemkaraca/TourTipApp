'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Metric } from '@/types/monitoring';

interface MetricCardProps {
  metric: Metric;
  previousValue?: number;
  showTrend?: boolean;
  className?: string;
}

export function MetricCard({ metric, previousValue, showTrend = true, className }: MetricCardProps) {
  const getTrend = () => {
    if (!previousValue || previousValue === 0) return null;
    const change = ((metric.value - previousValue) / previousValue) * 100;
    if (Math.abs(change) < 0.1) return { icon: Minus, text: '0%', color: 'text-gray-500' };
    if (change > 0) return { icon: TrendingUp, text: `+${change.toFixed(1)}%`, color: 'text-green-500' };
    return { icon: TrendingDown, text: `${change.toFixed(1)}%`, color: 'text-red-500' };
  };

  const trend = getTrend();

  const formatValue = (value: number, unit?: string) => {
    if (unit === 'bytes') {
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(value) / Math.log(1024));
      return `${(value / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }
    if (unit === 'ms') return `${value.toFixed(0)}ms`;
    if (unit === '%') return `${value.toFixed(1)}%`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(1);
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium capitalize">
          {metric.name.replace(/_/g, ' ')}
        </CardTitle>
        {metric.type && (
          <Badge variant="secondary" className="text-xs">
            {metric.type}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatValue(metric.value, metric.unit)}
        </div>
        {showTrend && trend && (
          <div className={`flex items-center text-xs ${trend.color}`}>
            <trend.icon className="h-3 w-3 mr-1" />
            {trend.text}
          </div>
        )}
        {metric.labels && Object.keys(metric.labels).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(metric.labels).map(([key, value]) => (
              <Badge key={key} variant="outline" className="text-xs">
                {key}: {value}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
