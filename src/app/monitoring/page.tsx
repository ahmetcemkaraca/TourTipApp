'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useMonitoring } from '@/hooks/use-monitoring';
import { MetricCard } from '@/components/monitoring/MetricCard';
import { SystemHealthCard } from '@/components/monitoring/SystemHealthCard';
import { AlertCard } from '@/components/monitoring/AlertCard';
import { RealTimeMetrics } from '@/components/monitoring/RealTimeMetrics';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Activity, 
  BarChart3, 
  Shield, 
  AlertTriangle, 
  RefreshCw,
  Settings,
  Download,
  Filter,
  Search,
  Users,
  TrendingUp
} from 'lucide-react';

export default function MonitoringPage() {
  const {
    loading,
    metrics,
    systemHealth,
    alerts,
    realTimeMetrics,
    fetchMetrics,
    fetchSystemHealth,
    fetchAlerts,
    resolveAlert,
    subscribeToRealTimeMetrics,
    subscribeToSystemHealth,
    subscribeToAlerts,
    healthCheckAPI,
    healthCheckDatabase,
  } = useMonitoring();

  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [alertFilter, setAlertFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [metricFilter, setMetricFilter] = useState('');
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Initial data load
    loadData();
    
    // Set up real-time subscriptions
    const unsubscribeRealTime = subscribeToRealTimeMetrics();
    const unsubscribeHealth = subscribeToSystemHealth();
    const unsubscribeAlerts = subscribeToAlerts();
    
    setIsRealTimeConnected(true);
    
    return () => {
      unsubscribeRealTime();
      unsubscribeHealth();
      unsubscribeAlerts();
    };
  }, []);

  const loadData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchMetrics(undefined, timeRange),
        fetchSystemHealth(),
        fetchAlerts(undefined, undefined, timeRange),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadData();
  };

  const handleHealthCheck = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        healthCheckAPI('/api/health'),
        healthCheckDatabase(),
      ]);
      await fetchSystemHealth();
    } finally {
      setRefreshing(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    await resolveAlert(alertId, 'current-user'); // In real app, get current user
  };

  const handleTimeRangeChange = async (newTimeRange: string) => {
    setTimeRange(newTimeRange as '1h' | '6h' | '24h' | '7d' | '30d');
    await fetchMetrics(undefined, newTimeRange as '1h' | '6h' | '24h' | '7d' | '30d');
    await fetchAlerts(undefined, undefined, newTimeRange as '1h' | '6h' | '24h' | '7d' | '30d');
  };

  const filteredMetrics = metrics.filter(metric => 
    metric.name.toLowerCase().includes(metricFilter.toLowerCase())
  );

  const filteredAlerts = alerts.filter(alert => {
    if (alertFilter === 'active') return alert.status !== 'normal';
    if (alertFilter === 'resolved') return alert.status === 'normal';
    return true;
  });

  const getOverallStatus = () => {
    const criticalAlerts = alerts.filter(a => a.level === 'critical' && a.status !== 'normal').length;
    const downServices = systemHealth.filter(h => h.status === 'down').length;
    
    if (criticalAlerts > 0 || downServices > 0) return { status: 'critical', color: 'bg-red-500' };
    
    const warningAlerts = alerts.filter(a => a.level === 'warning' && a.status !== 'normal').length;
    const degradedServices = systemHealth.filter(h => h.status === 'degraded').length;
    
    if (warningAlerts > 0 || degradedServices > 0) return { status: 'warning', color: 'bg-yellow-500' };
    
    return { status: 'healthy', color: 'bg-green-500' };
  };

  const overallStatus = getOverallStatus();

  const keyMetrics = [
    { label: 'Active Alerts', value: alerts.filter(a => a.status !== 'normal').length, icon: AlertTriangle },
    { label: 'Healthy Services', value: systemHealth.filter(h => h.status === 'healthy').length, icon: Shield },
    { label: 'Total Metrics', value: metrics.length, icon: BarChart3 },
    { label: 'Active Users', value: realTimeMetrics?.activeUsers || 0, icon: Users },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Monitoring Dashboard</h1>
          <p className="text-gray-600">
            Real-time system monitoring and observability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${overallStatus.color} text-white`}>
            System {overallStatus.status}
          </Badge>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            {refreshing ? (
              <LoadingSpinner className="h-4 w-4 mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button onClick={handleHealthCheck} disabled={refreshing} variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Health Check
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {keyMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="flex items-center p-6">
              <metric.icon className="h-8 w-8 text-blue-500 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <RealTimeMetrics 
          metrics={realTimeMetrics} 
          isConnected={isRealTimeConnected}
          className="lg:col-span-2"
        />
        
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Export Metrics
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Configure Alerts
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Activity className="h-4 w-4 mr-2" />
              View Logs
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health Summary */}
            <Card>
              <CardHeader>
                <CardTitle>System Health Summary</CardTitle>
                <CardDescription>Current status of all monitored services</CardDescription>
              </CardHeader>
              <CardContent>
                {systemHealth.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No health data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {systemHealth.slice(0, 5).map((health) => (
                      <SystemHealthCard key={health.id} health={health} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Latest system alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No alerts
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.slice(0, 5).map((alert) => (
                      <AlertCard 
                        key={alert.id} 
                        alert={alert} 
                        onResolve={handleResolveAlert}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Metrics</CardTitle>
              <CardDescription>Custom metrics and performance data</CardDescription>
              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Filter metrics..."
                    value={metricFilter}
                    onChange={(e) => setMetricFilter(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 hour</SelectItem>
                    <SelectItem value="6h">6 hours</SelectItem>
                    <SelectItem value="24h">24 hours</SelectItem>
                    <SelectItem value="7d">7 days</SelectItem>
                    <SelectItem value="30d">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner className="h-6 w-6" />
                </div>
              ) : filteredMetrics.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No metrics found
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMetrics.map((metric) => (
                    <MetricCard key={metric.id} metric={metric} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Monitor the health of all system components</CardDescription>
            </CardHeader>
            <CardContent>
              {systemHealth.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No health data available
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {systemHealth.map((health) => (
                    <SystemHealthCard key={health.id} health={health} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
              <CardDescription>System alerts and notifications</CardDescription>
              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={alertFilter} onValueChange={setAlertFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Alerts</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="resolved">Resolved Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 hour</SelectItem>
                    <SelectItem value="6h">6 hours</SelectItem>
                    <SelectItem value="24h">24 hours</SelectItem>
                    <SelectItem value="7d">7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner className="h-6 w-6" />
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No alerts found
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts.map((alert) => (
                    <AlertCard 
                      key={alert.id} 
                      alert={alert} 
                      onResolve={handleResolveAlert}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
