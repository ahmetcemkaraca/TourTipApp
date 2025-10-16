'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useAdvancedSecurity } from '@/hooks/use-advanced-security';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Shield, 
  Eye, 
  AlertTriangle, 
  Lock, 
  Fingerprint, 
  Brain,
  Activity,
  Settings,
  RefreshCw,
  Zap,
  UserCheck,
  Globe,
  Database,
  Code,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3
} from 'lucide-react';

export default function AdvancedSecurityPage() {
  const {
    loading,
    securityEvents,
    threatDetections,
    securityRules,
    deviceFingerprints,
    securityMetrics,
    fetchSecurityEvents,
    createSecurityRule,
    testSecurityRule,
    collectSecurityMetrics,
    logSuspiciousActivity,
    verifyRecaptcha,
    checkBiometricSupport,
    authenticateWithBiometrics,
    validateSession,
  } = useAdvancedSecurity();

  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    category: 'firestore' as const,
    rule: '',
    enabled: true,
    priority: 100,
  });
  const [ruleTestResult, setRuleTestResult] = useState<any>(null);
  const [biometricSupport, setBiometricSupport] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadData();
    checkBiometrics();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchSecurityEvents({ timeRange: selectedTimeRange }),
      collectSecurityMetrics(),
    ]);
  };

  const checkBiometrics = () => {
    const support = checkBiometricSupport();
    setBiometricSupport(support);
  };

  const handleCreateRule = async () => {
    if (!newRule.name || !newRule.rule) return;
    
    const rule = await createSecurityRule({
      ...newRule,
      createdBy: 'current-user', // In real app, get current user
    });
    
    if (rule) {
      setNewRule({
        name: '',
        description: '',
        category: 'firestore',
        rule: '',
        enabled: true,
        priority: 100,
      });
    }
  };

  const handleTestRule = async () => {
    if (!newRule.rule) return;
    
    const result = await testSecurityRule(newRule.rule);
    setRuleTestResult(result);
  };

  const handleBiometricAuth = async () => {
    const result = await authenticateWithBiometrics();
    if (result.success) {
      alert('Biometric authentication successful!');
    } else {
      alert(`Biometric authentication failed: ${result.error}`);
    }
  };

  const handleTestSuspiciousActivity = async () => {
    await logSuspiciousActivity('Test suspicious activity', 85, {
      testEvent: true,
      triggeredBy: 'manual_test',
    });
    await fetchSecurityEvents({ timeRange: selectedTimeRange });
  };

  const getSecurityScore = () => {
    if (!securityMetrics) return 0;
    
    const threats = Object.values(securityMetrics.threatDetections || {}).reduce((a, b) => a + b, 0);
    const events = Object.values(securityMetrics.securityEvents || {}).reduce((a, b) => a + b, 0);
    
    // Calculate score based on threats and events (inverse relationship)
    const baseScore = 100;
    const threatPenalty = Math.min(50, threats * 5);
    const eventPenalty = Math.min(30, events * 2);
    
    return Math.max(0, baseScore - threatPenalty - eventPenalty);
  };

  const getActiveThreats = () => {
    return threatDetections.filter(t => !t.resolved && t.level !== 'none').length;
  };

  const getCriticalEvents = () => {
    return securityEvents.filter(e => e.level === 'critical' && !e.resolved).length;
  };

  const securityScore = getSecurityScore();
  const activeThreats = getActiveThreats();
  const criticalEvents = getCriticalEvents();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Advanced Security</h1>
          <p className="text-gray-600">
            Comprehensive security monitoring, threat detection, and protection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            className={`${securityScore > 80 ? 'bg-green-500' : securityScore > 60 ? 'bg-yellow-500' : 'bg-red-500'} text-white`}
          >
            Security Score: {securityScore}%
          </Badge>
          <Button onClick={loadData} disabled={loading} variant="outline">
            {loading ? (
              <LoadingSpinner className="h-4 w-4 mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center p-6">
            <Shield className="h-8 w-8 text-blue-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Security Score</p>
              <p className="text-2xl font-bold">{securityScore}%</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="h-8 w-8 text-red-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Active Threats</p>
              <p className="text-2xl font-bold">{activeThreats}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Eye className="h-8 w-8 text-yellow-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Events</p>
              <p className="text-2xl font-bold">{criticalEvents}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Fingerprint className="h-8 w-8 text-purple-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Devices Tracked</p>
              <p className="text-2xl font-bold">{deviceFingerprints.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="threats">Threats</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Security Metrics
                </CardTitle>
                <CardDescription>Real-time security statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {securityMetrics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Total Users</div>
                        <div className="text-2xl font-bold">{securityMetrics.totalUsers}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Active Users</div>
                        <div className="text-2xl font-bold">{securityMetrics.activeUsers}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Failed Logins</div>
                        <div className="text-2xl font-bold text-red-500">{securityMetrics.failedLogins}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Blocked IPs</div>
                        <div className="text-2xl font-bold text-orange-500">{securityMetrics.blockedIPs}</div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="text-sm text-gray-600 mb-2">Security Health</div>
                      <Progress value={securityScore} className="h-3" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Poor</span>
                        <span>Excellent</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No metrics available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Security Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Security Events
                </CardTitle>
                <CardDescription>Latest security activities</CardDescription>
              </CardHeader>
              <CardContent>
                {securityEvents.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No recent events
                  </div>
                ) : (
                  <div className="space-y-3">
                    {securityEvents.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {event.level === 'critical' ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : event.level === 'high' ? (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <div>
                            <div className="text-sm font-medium capitalize">
                              {event.type.replace(/_/g, ' ')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {event.ipAddress}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={event.level === 'critical' ? 'destructive' : 'secondary'}>
                            {event.level}
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">
                            {event.timestamp?.toDate?.()?.toLocaleTimeString() || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Security Actions
              </CardTitle>
              <CardDescription>Test and configure security features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={handleTestSuspiciousActivity}
                  variant="outline"
                  className="w-full"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Test Threat Detection
                </Button>
                
                <Button
                  onClick={handleBiometricAuth}
                  variant="outline"
                  className="w-full"
                  disabled={!biometricSupport?.supported}
                >
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Test Biometrics
                </Button>
                
                <Button
                  onClick={() => verifyRecaptcha('test-token', 'test-action')}
                  variant="outline"
                  className="w-full"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Test reCAPTCHA
                </Button>
                
                <Button
                  onClick={() => validateSession('current-session')}
                  variant="outline"
                  className="w-full"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Validate Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>Monitor all security-related activities</CardDescription>
              <div className="flex gap-4 mt-4">
                <Select value={selectedTimeRange} onValueChange={(value: any) => setSelectedTimeRange(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last hour</SelectItem>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner className="h-6 w-6" />
                </div>
              ) : securityEvents.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No security events found
                </div>
              ) : (
                <div className="space-y-4">
                  {securityEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {event.level === 'critical' ? (
                            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                          ) : event.level === 'high' ? (
                            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="font-medium capitalize">
                              {event.type.replace(/_/g, ' ')}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {event.details.resource && `Resource: ${event.details.resource}`}
                              {event.details.action && ` • Action: ${event.details.action}`}
                              {event.details.outcome && ` • Outcome: ${event.details.outcome}`}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              IP: {event.ipAddress} • User Agent: {event.userAgent.substring(0, 50)}...
                            </div>
                            {event.location && (
                              <div className="text-xs text-gray-500">
                                Location: {event.location.city}, {event.location.country}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={event.level === 'critical' ? 'destructive' : event.level === 'high' ? 'secondary' : 'default'}>
                            {event.level}
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {event.timestamp?.toDate?.()?.toLocaleString() || 'Unknown'}
                          </div>
                          {event.resolved && (
                            <div className="text-xs text-green-600 mt-1">
                              ✓ Resolved
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Security Rule</CardTitle>
              <CardDescription>Define custom security rules for your application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Rule Name</label>
                  <Input
                    value={newRule.name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Restrict admin access"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select 
                    value={newRule.category} 
                    onValueChange={(value: any) => setNewRule(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="firestore">Firestore</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="functions">Functions</SelectItem>
                      <SelectItem value="authentication">Authentication</SelectItem>
                      <SelectItem value="authorization">Authorization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={newRule.description}
                  onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this rule does"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Security Rule</label>
                <Textarea
                  value={newRule.rule}
                  onChange={(e) => setNewRule(prev => ({ ...prev, rule: e.target.value }))}
                  placeholder="allow read, write: if request.auth != null"
                  rows={4}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newRule.enabled}
                  onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, enabled: checked }))}
                />
                <label className="text-sm font-medium">Enabled</label>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleTestRule} variant="outline">
                  <Code className="h-4 w-4 mr-2" />
                  Test Rule
                </Button>
                <Button onClick={handleCreateRule} disabled={!newRule.name || !newRule.rule}>
                  <Shield className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </div>
              
              {ruleTestResult && (
                <div className={`p-3 rounded border ${ruleTestResult.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {ruleTestResult.passed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">
                      {ruleTestResult.passed ? 'Rule syntax is valid' : 'Rule syntax has errors'}
                    </span>
                  </div>
                  {ruleTestResult.errors?.length > 0 && (
                    <div className="text-sm text-red-600">
                      <div className="font-medium">Errors:</div>
                      <ul className="list-disc list-inside">
                        {ruleTestResult.errors.map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {ruleTestResult.warnings?.length > 0 && (
                    <div className="text-sm text-yellow-600 mt-2">
                      <div className="font-medium">Warnings:</div>
                      <ul className="list-disc list-inside">
                        {ruleTestResult.warnings.map((warning: string, index: number) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Existing Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Security Rules</CardTitle>
              <CardDescription>Manage existing security rules</CardDescription>
            </CardHeader>
            <CardContent>
              {securityRules.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No security rules defined
                </div>
              ) : (
                <div className="space-y-4">
                  {securityRules.map((rule) => (
                    <div key={rule.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{rule.description}</div>
                          <div className="text-xs text-gray-500 mt-2">
                            Category: {rule.category} • Priority: {rule.priority}
                          </div>
                          <div className="bg-gray-50 p-2 rounded mt-2 text-xs font-mono">
                            {rule.rule}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                            {rule.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          {rule.testResults?.passed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Device Fingerprints Tab */}
        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Device Fingerprints
              </CardTitle>
              <CardDescription>Track and manage device fingerprints for security</CardDescription>
            </CardHeader>
            <CardContent>
              {biometricSupport && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Fingerprint className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Biometric Authentication Status</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Support: {biometricSupport.supported ? '✅ Available' : '❌ Not available'}
                    {biometricSupport.methods.length > 0 && (
                      <span> • Methods: {biometricSupport.methods.join(', ')}</span>
                    )}
                  </div>
                  {biometricSupport.supported && (
                    <Button 
                      onClick={handleBiometricAuth} 
                      className="mt-2" 
                      size="sm"
                    >
                      Test Biometric Authentication
                    </Button>
                  )}
                </div>
              )}

              {deviceFingerprints.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No device fingerprints available
                </div>
              ) : (
                <div className="space-y-4">
                  {deviceFingerprints.map((device) => (
                    <div key={device.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">Device {device.deviceId.substring(0, 8)}...</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {device.fingerprint.platform} • {device.fingerprint.userAgent.substring(0, 50)}...
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Screen: {device.fingerprint.screenResolution} • 
                            Language: {device.fingerprint.language} • 
                            Timezone: {device.fingerprint.timezone}
                          </div>
                          <div className="text-xs text-gray-500">
                            First seen: {device.firstSeen?.toDate?.()?.toLocaleString()} • 
                            Last seen: {device.lastSeen?.toDate?.()?.toLocaleString()} • 
                            Login count: {device.loginCount}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={device.trusted ? 'default' : 'destructive'}>
                            {device.trusted ? 'Trusted' : 'Untrusted'}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            Risk: {device.riskScore}%
                          </div>
                          <Progress value={device.riskScore} className="w-20 h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure advanced security features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Authentication Security</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Enable App Check</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Require reCAPTCHA</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Enable Biometric Auth</span>
                      <Switch defaultChecked={biometricSupport?.supported} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Device Fingerprinting</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Threat Detection</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-block suspicious IPs</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Real-time threat monitoring</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Behavioral analysis</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Automated responses</span>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h4 className="font-medium mb-4">Alert Thresholds</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Failed login attempts per minute</label>
                    <Input type="number" defaultValue="10" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Suspicious activity score threshold</label>
                    <Input type="number" defaultValue="80" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">New device logins per hour</label>
                    <Input type="number" defaultValue="5" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Data exfiltration size (MB)</label>
                    <Input type="number" defaultValue="10" className="mt-1" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <Button className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
