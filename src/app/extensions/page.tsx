'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirebaseExtensions } from '@/hooks/use-firebase-extensions';
import { useLoadingState } from '@/hooks/use-loading-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  CreditCard, 
  Mail, 
  Search, 
  Image, 
  Languages, 
  Link2, 
  MessageSquare,
  Activity,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

export default function ExtensionsPage() {
  const {
    loading,
    processStripePayment,
    sendTemplatedEmail,
    updateSearchIndex,
    processImage,
    translateContent,
    shortenUrl,
    sendSMS,
    checkExtensionsHealth,
  } = useFirebaseExtensions();

  const { isLoading, startLoading, stopLoading } = useLoadingState();
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [results, setResults] = useState<any>({});

  useEffect(() => {
    loadHealthStatus();
  }, []);

  const loadHealthStatus = async () => {
    startLoading('health-check');
    try {
      const status = await checkExtensionsHealth();
      setHealthStatus(status);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      stopLoading('health-check');
    }
  };

  const handleStripePayment = async () => {
    startLoading('stripe');
    try {
      const result = await processStripePayment(
        'price_1234567890', // Example price ID
        1,
        { productName: 'Test Tour', tourId: 'tour_123' }
      );
      setResults(prev => ({ ...prev, stripe: result }));
    } finally {
      stopLoading('stripe');
    }
  };

  const handleSendEmail = async () => {
    startLoading('email');
    try {
      const result = await sendTemplatedEmail(
        'test@example.com',
        'welcome_template',
        { userName: 'John Doe', tourName: 'Istanbul Tour' }
      );
      setResults(prev => ({ ...prev, email: result }));
    } finally {
      stopLoading('email');
    }
  };

  const handleUpdateSearch = async () => {
    startLoading('search');
    try {
      const result = await updateSearchIndex(
        'tours',
        'tour_123',
        {
          title: 'Amazing Istanbul Tour',
          description: 'Discover the beauty of Istanbul',
          tags: ['istanbul', 'history', 'culture'],
          price: 299
        }
      );
      setResults(prev => ({ ...prev, search: result }));
    } finally {
      stopLoading('search');
    }
  };

  const handleProcessImage = async () => {
    startLoading('image');
    try {
      const result = await processImage(
        'tours/istanbul/hero.jpg',
        '200x200,400x400,800x800',
        'webp',
        80
      );
      setResults(prev => ({ ...prev, image: result }));
    } finally {
      stopLoading('image');
    }
  };

  const handleTranslate = async () => {
    startLoading('translate');
    try {
      const result = await translateContent(
        'tours',
        'tour_123',
        'description',
        ['en', 'de', 'fr', 'es']
      );
      setResults(prev => ({ ...prev, translate: result }));
    } finally {
      stopLoading('translate');
    }
  };

  const handleShortenUrl = async () => {
    startLoading('url');
    try {
      const result = await shortenUrl(
        'https://tourtrip.app/tours/istanbul-historical-tour',
        'istanbul-tour'
      );
      setResults(prev => ({ ...prev, url: result }));
    } finally {
      stopLoading('url');
    }
  };

  const handleSendSMS = async () => {
    startLoading('sms');
    try {
      const result = await sendSMS(
        '+905551234567',
        'Your tour booking has been confirmed! Tour starts at 9:00 AM tomorrow.'
      );
      setResults(prev => ({ ...prev, sms: result }));
    } finally {
      stopLoading('sms');
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Firebase Extensions</h1>
        <p className="text-gray-600">
          Firebase Extensions Demo - Test and monitor Firebase Extensions functionality
        </p>
      </div>

      {/* Health Status */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Extensions Health Status
            </CardTitle>
            <CardDescription>
              Monitor the status of all Firebase Extensions
            </CardDescription>
          </div>
          <Button 
            onClick={loadHealthStatus} 
            disabled={isLoading('health-check')}
            variant="outline"
          >
            {isLoading('health-check') ? (
              <LoadingSpinner className="h-4 w-4" />
            ) : (
              'Refresh'
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {healthStatus ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(healthStatus).map(([key, value]) => {
                if (key === 'timestamp') return null;
                return (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="capitalize text-sm font-medium">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                    {getStatusIcon(value as boolean)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner className="h-6 w-6" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extensions Demos */}
      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="image">Images</TabsTrigger>
          <TabsTrigger value="translate">Translate</TabsTrigger>
          <TabsTrigger value="url">URL</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Stripe Payments */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe Payments Extension
              </CardTitle>
              <CardDescription>
                Test payment processing with Stripe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium">Price ID</label>
                  <Input 
                    placeholder="price_1234567890" 
                    defaultValue="price_1234567890"
                    disabled
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <Input type="number" defaultValue="1" min="1" disabled />
                </div>
                <Button 
                  onClick={handleStripePayment} 
                  disabled={isLoading('stripe')}
                  className="w-full"
                >
                  {isLoading('stripe') ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Create Checkout Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Extension */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Extension
              </CardTitle>
              <CardDescription>
                Send templated emails using Firebase Extensions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <Input 
                    type="email" 
                    placeholder="test@example.com"
                    defaultValue="test@example.com"
                    disabled
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Template ID</label>
                  <Input 
                    placeholder="welcome_template"
                    defaultValue="welcome_template"
                    disabled
                  />
                </div>
                <Button 
                  onClick={handleSendEmail} 
                  disabled={isLoading('email')}
                  className="w-full"
                >
                  {isLoading('email') ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Send Template Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Index */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Index Extension
              </CardTitle>
              <CardDescription>
                Update search indexes with Algolia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium">Collection</label>
                  <Input defaultValue="tours" disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">Document ID</label>
                  <Input defaultValue="tour_123" disabled />
                </div>
                <Button 
                  onClick={handleUpdateSearch} 
                  disabled={isLoading('search')}
                  className="w-full"
                >
                  {isLoading('search') ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Update Search Index
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Image Processing */}
        <TabsContent value="image">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Image Resize Extension
              </CardTitle>
              <CardDescription>
                Process and resize images automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium">Image Path</label>
                  <Input defaultValue="tours/istanbul/hero.jpg" disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">Sizes</label>
                  <Input defaultValue="200x200,400x400,800x800" disabled />
                </div>
                <Button 
                  onClick={handleProcessImage} 
                  disabled={isLoading('image')}
                  className="w-full"
                >
                  {isLoading('image') ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : (
                    <Image className="h-4 w-4 mr-2" />
                  )}
                  Process Image
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Translation */}
        <TabsContent value="translate">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Translation Extension
              </CardTitle>
              <CardDescription>
                Translate content to multiple languages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium">Collection</label>
                  <Input defaultValue="tours" disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">Field to Translate</label>
                  <Input defaultValue="description" disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">Target Languages</label>
                  <Input defaultValue="en, de, fr, es" disabled />
                </div>
                <Button 
                  onClick={handleTranslate} 
                  disabled={isLoading('translate')}
                  className="w-full"
                >
                  {isLoading('translate') ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : (
                    <Languages className="h-4 w-4 mr-2" />
                  )}
                  Translate Content
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* URL Shortener */}
        <TabsContent value="url">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                URL Shortener Extension
              </CardTitle>
              <CardDescription>
                Create short URLs with analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium">Original URL</label>
                  <Input 
                    defaultValue="https://tourtrip.app/tours/istanbul-historical-tour"
                    disabled
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Custom Alias</label>
                  <Input defaultValue="istanbul-tour" disabled />
                </div>
                <Button 
                  onClick={handleShortenUrl} 
                  disabled={isLoading('url')}
                  className="w-full"
                >
                  {isLoading('url') ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : (
                    <Link2 className="h-4 w-4 mr-2" />
                  )}
                  Shorten URL
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS */}
        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                SMS Extension
              </CardTitle>
              <CardDescription>
                Send SMS notifications via Twilio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input 
                    placeholder="+905551234567"
                    defaultValue="+905551234567"
                    disabled
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea 
                    placeholder="Your tour booking has been confirmed!"
                    defaultValue="Your tour booking has been confirmed! Tour starts at 9:00 AM tomorrow."
                    disabled
                  />
                </div>
                <Button 
                  onClick={handleSendSMS} 
                  disabled={isLoading('sms')}
                  className="w-full"
                >
                  {isLoading('sms') ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  Send SMS
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Extension Results</CardTitle>
              <CardDescription>
                View the results of extension operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(results).length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No results yet. Try using one of the extensions above.
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(results).map(([key, result]) => (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{key}</Badge>
                        <Clock className="h-4 w-4 text-gray-500" />
                      </div>
                      <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
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
