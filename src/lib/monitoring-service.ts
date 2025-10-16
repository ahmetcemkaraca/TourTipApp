import { db, analytics } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, query, where, orderBy, limit, getDocs, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getPerformance, trace, connectPerformanceEmulator } from 'firebase/performance';
import { logEvent } from 'firebase/analytics';
import { 
  Metric, 
  PerformanceMetric, 
  SystemHealth, 
  Alert, 
  LogEntry, 
  AlertRule, 
  MonitoringConfig, 
  RealTimeMetrics, 
  ServiceStatus,
  MetricType,
  AlertLevel,
  AlertStatus 
} from '@/types/monitoring';
import { AppError } from '@/types/error';

// Configuration from environment variables
const config: MonitoringConfig = {
  enablePerformanceTracking: process.env.NEXT_PUBLIC_MONITORING_ENABLE_PERFORMANCE === 'true',
  enableRealUserMonitoring: process.env.NEXT_PUBLIC_MONITORING_ENABLE_RUM === 'true',
  enableErrorTracking: process.env.NEXT_PUBLIC_MONITORING_ENABLE_ERRORS === 'true',
  enableCustomMetrics: process.env.NEXT_PUBLIC_MONITORING_ENABLE_CUSTOM_METRICS === 'true',
  metricRetentionDays: parseInt(process.env.MONITORING_METRIC_RETENTION_DAYS || '30', 10),
  alertRetentionDays: parseInt(process.env.MONITORING_ALERT_RETENTION_DAYS || '90', 10),
  logRetentionDays: parseInt(process.env.MONITORING_LOG_RETENTION_DAYS || '7', 10),
  defaultRefreshInterval: parseInt(process.env.MONITORING_DEFAULT_REFRESH_INTERVAL || '30', 10),
  maxDashboardWidgets: parseInt(process.env.MONITORING_MAX_DASHBOARD_WIDGETS || '20', 10),
};

class MonitoringService {
  private metricsCollection = collection(db, 'metrics');
  private performanceCollection = collection(db, 'performanceMetrics');
  private systemHealthCollection = collection(db, 'systemHealth');
  private alertsCollection = collection(db, 'alerts');
  private logsCollection = collection(db, 'logs');
  private alertRulesCollection = collection(db, 'alertRules');
  private performance = typeof window !== 'undefined' ? getPerformance() : null;
  
  // Initialize monitoring in development
  constructor() {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      try {
        // Connect to emulator if in development
        if (this.performance && process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true') {
          connectPerformanceEmulator(this.performance, 'localhost', 9099);
        }
      } catch (error) {
        console.warn('Failed to connect to Performance emulator:', error);
      }
    }
  }

  // --- Custom Metrics ---
  async recordMetric(name: string, value: number, type: MetricType = 'gauge', labels?: { [key: string]: string }, unit?: string): Promise<void> {
    if (!config.enableCustomMetrics) return;
    
    try {
      const metric: Omit<Metric, 'id'> = {
        name,
        type,
        value,
        unit,
        timestamp: serverTimestamp() as Timestamp,
        labels,
        description: `Custom metric: ${name}`,
      };

      await addDoc(this.metricsCollection, metric);
      
      // Also log to Firebase Analytics
      if (analytics && typeof window !== 'undefined') {
        logEvent(analytics, 'custom_metric', {
          metric_name: name,
          metric_value: value,
          metric_type: type,
          metric_unit: unit,
        });
      }
    } catch (error: any) {
      console.error('Failed to record metric:', error);
      throw new AppError('MONITORING_METRIC_RECORD_FAILED', 'Metrik kaydedilemedi.', 'warning', { name, value, originalError: error.message });
    }
  }

  async getMetrics(metricName?: string, timeRange: '1h' | '6h' | '24h' | '7d' | '30d' = '24h', labels?: { [key: string]: string }): Promise<Metric[]> {
    try {
      const timeRangeMs = this.getTimeRangeMs(timeRange);
      const cutoffTime = new Date(Date.now() - timeRangeMs);
      
      let q = query(
        this.metricsCollection,
        where('timestamp', '>=', cutoffTime),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      if (metricName) {
        q = query(q, where('name', '==', metricName));
      }

      const querySnapshot = await getDocs(q);
      let metrics = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Metric));

      // Filter by labels if provided
      if (labels) {
        metrics = metrics.filter(metric => {
          if (!metric.labels) return false;
          return Object.entries(labels).every(([key, value]) => metric.labels?.[key] === value);
        });
      }

      return metrics;
    } catch (error: any) {
      throw new AppError('MONITORING_METRICS_FETCH_FAILED', 'Metrikler alınamadı.', 'critical', { metricName, timeRange, originalError: error.message });
    }
  }

  // --- Performance Monitoring ---
  async recordPerformanceMetric(metricName: string, value: number, metadata?: any): Promise<void> {
    if (!config.enablePerformanceTracking) return;
    
    try {
      const performanceMetric: Omit<PerformanceMetric, 'id'> = {
        metricName,
        value,
        timestamp: serverTimestamp() as Timestamp,
        userId: metadata?.userId,
        sessionId: metadata?.sessionId,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        deviceCategory: this.getDeviceCategory(),
        browserName: this.getBrowserName(),
        browserVersion: this.getBrowserVersion(),
        osName: this.getOSName(),
        osVersion: this.getOSVersion(),
        connectionType: this.getConnectionType(),
      };

      await addDoc(this.performanceCollection, performanceMetric);
      
      // Also record in Firebase Performance
      if (this.performance && typeof window !== 'undefined') {
        const perfTrace = trace(this.performance, metricName);
        perfTrace.start();
        perfTrace.putMetric('value', value);
        perfTrace.stop();
      }
    } catch (error: any) {
      console.error('Failed to record performance metric:', error);
      throw new AppError('MONITORING_PERFORMANCE_RECORD_FAILED', 'Performans metriği kaydedilemedi.', 'warning', { metricName, value, originalError: error.message });
    }
  }

  // --- System Health ---
  async updateSystemHealth(service: string, status: 'healthy' | 'degraded' | 'down', responseTime?: number, errorRate?: number, details?: any): Promise<void> {
    try {
      const healthData: Omit<SystemHealth, 'id'> = {
        service,
        status,
        responseTime,
        errorRate,
        uptime: status === 'healthy' ? 100 : status === 'degraded' ? 75 : 0,
        lastCheck: serverTimestamp() as Timestamp,
        details,
      };

      // Check if health record exists for this service
      const q = query(this.systemHealthCollection, where('service', '==', service), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await addDoc(this.systemHealthCollection, healthData);
      } else {
        await updateDoc(querySnapshot.docs[0].ref, healthData as any);
      }
    } catch (error: any) {
      throw new AppError('MONITORING_HEALTH_UPDATE_FAILED', 'Sistem sağlığı güncellenemedi.', 'critical', { service, status, originalError: error.message });
    }
  }

  async getSystemHealth(): Promise<SystemHealth[]> {
    try {
      const q = query(this.systemHealthCollection, orderBy('lastCheck', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemHealth));
    } catch (error: any) {
      throw new AppError('MONITORING_HEALTH_FETCH_FAILED', 'Sistem sağlığı alınamadı.', 'critical', { originalError: error.message });
    }
  }

  // --- Alerts ---
  async createAlert(title: string, description: string, level: AlertLevel, service: string, metricName?: string, currentValue?: number, threshold?: number): Promise<Alert> {
    try {
      const alert: Omit<Alert, 'id'> = {
        title,
        description,
        level,
        status: 'warning',
        service,
        metricName,
        threshold,
        currentValue,
        triggeredAt: serverTimestamp() as Timestamp,
        tags: [service, level],
      };

      const docRef = await addDoc(this.alertsCollection, alert);
      
      // Send notifications based on level
      await this.sendAlertNotification(alert, docRef.id);
      
      return { id: docRef.id, ...alert };
    } catch (error: any) {
      throw new AppError('MONITORING_ALERT_CREATE_FAILED', 'Uyarı oluşturulamadı.', 'critical', { title, level, service, originalError: error.message });
    }
  }

  async resolveAlert(alertId: string, assignedTo?: string): Promise<void> {
    try {
      await updateDoc(doc(this.alertsCollection, alertId), {
        status: 'normal',
        resolvedAt: serverTimestamp(),
        assignedTo,
      });
    } catch (error: any) {
      throw new AppError('MONITORING_ALERT_RESOLVE_FAILED', 'Uyarı çözümlenemedi.', 'critical', { alertId, originalError: error.message });
    }
  }

  async getAlerts(status?: AlertStatus, level?: AlertLevel, timeRange?: '1h' | '6h' | '24h' | '7d' = '24h'): Promise<Alert[]> {
    try {
      const timeRangeMs = this.getTimeRangeMs(timeRange);
      const cutoffTime = new Date(Date.now() - timeRangeMs);
      
      let q = query(
        this.alertsCollection,
        where('triggeredAt', '>=', cutoffTime),
        orderBy('triggeredAt', 'desc'),
        limit(100)
      );

      if (status) {
        q = query(q, where('status', '==', status));
      }

      if (level) {
        q = query(q, where('level', '==', level));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
    } catch (error: any) {
      throw new AppError('MONITORING_ALERTS_FETCH_FAILED', 'Uyarılar alınamadı.', 'critical', { status, level, timeRange, originalError: error.message });
    }
  }

  // --- Logging ---
  async logEntry(level: LogEntry['level'], message: string, service: string, metadata?: any, stackTrace?: string): Promise<void> {
    if (!config.enableErrorTracking && level === 'error') return;
    
    try {
      const logEntry: Omit<LogEntry, 'id'> = {
        level,
        message,
        service,
        timestamp: serverTimestamp() as Timestamp,
        userId: metadata?.userId,
        sessionId: metadata?.sessionId,
        requestId: metadata?.requestId,
        metadata,
        stackTrace,
        environment: process.env.NODE_ENV,
      };

      await addDoc(this.logsCollection, logEntry);
      
      // Create alert for error logs
      if (level === 'error' || level === 'fatal') {
        await this.createAlert(
          `${level.toUpperCase()}: ${service}`,
          message,
          level === 'fatal' ? 'critical' : 'error',
          service
        );
      }
    } catch (error: any) {
      console.error('Failed to log entry:', error);
    }
  }

  // --- Real-time Monitoring ---
  subscribeToRealTimeMetrics(callback: (metrics: RealTimeMetrics) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    
    const interval = setInterval(async () => {
      try {
        const metrics: RealTimeMetrics = {
          activeUsers: await this.getActiveUsersCount(),
          requestsPerSecond: await this.getRequestsPerSecond(),
          averageResponseTime: await this.getAverageResponseTime(),
          errorRate: await this.getErrorRate(),
          cpuUsage: this.getCPUUsage(),
          memoryUsage: this.getMemoryUsage(),
          diskUsage: 0, // Not available in browser
          networkLatency: await this.getNetworkLatency(),
          timestamp: new Date(),
        };
        
        callback(metrics);
      } catch (error) {
        console.error('Failed to get real-time metrics:', error);
      }
    }, config.defaultRefreshInterval * 1000);

    return () => clearInterval(interval);
  }

  subscribeToSystemHealth(callback: (health: SystemHealth[]) => void): () => void {
    const q = query(this.systemHealthCollection, orderBy('lastCheck', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const health = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemHealth));
      callback(health);
    });
  }

  subscribeToAlerts(callback: (alerts: Alert[]) => void, status?: AlertStatus): () => void {
    let q = query(this.alertsCollection, orderBy('triggeredAt', 'desc'), limit(50));
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    return onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
      callback(alerts);
    });
  }

  // --- Utility Methods ---
  private getTimeRangeMs(timeRange: string): number {
    const ranges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    return ranges[timeRange as keyof typeof ranges] || ranges['24h'];
  }

  private getDeviceCategory(): string {
    if (typeof window === 'undefined') return 'unknown';
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getBrowserName(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'unknown';
  }

  private getBrowserVersion(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return match ? match[2] : 'unknown';
  }

  private getOSName(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'unknown';
  }

  private getOSVersion(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    // This would require more sophisticated parsing
    return 'unknown';
  }

  private getConnectionType(): string {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) return 'unknown';
    const connection = (navigator as any).connection;
    return connection?.effectiveType || 'unknown';
  }

  private getCPUUsage(): number {
    // Not directly available in browser, return mock data
    return Math.random() * 100;
  }

  private getMemoryUsage(): number {
    if (typeof performance === 'undefined' || !('memory' in performance)) return 0;
    const memory = (performance as any).memory;
    return (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
  }

  private async getActiveUsersCount(): Promise<number> {
    // This would typically come from your analytics or real-time user tracking
    return Math.floor(Math.random() * 100) + 10;
  }

  private async getRequestsPerSecond(): Promise<number> {
    // This would come from your server metrics
    return Math.floor(Math.random() * 50) + 5;
  }

  private async getAverageResponseTime(): Promise<number> {
    // This would come from your server metrics
    return Math.floor(Math.random() * 500) + 100;
  }

  private async getErrorRate(): Promise<number> {
    // This would come from your error tracking
    return Math.random() * 5;
  }

  private async getNetworkLatency(): Promise<number> {
    if (typeof window === 'undefined') return 0;
    
    try {
      const start = performance.now();
      await fetch('/api/ping', { method: 'HEAD' });
      return performance.now() - start;
    } catch {
      return 0;
    }
  }

  private async sendAlertNotification(alert: Omit<Alert, 'id'>, alertId: string): Promise<void> {
    // This would integrate with your notification system
    console.log(`Alert triggered: ${alert.title} - ${alert.description}`);
    
    // You could integrate with:
    // - Email service
    // - Slack webhooks
    // - SMS service
    // - Push notifications
  }
}

export const monitoringService = new MonitoringService();
