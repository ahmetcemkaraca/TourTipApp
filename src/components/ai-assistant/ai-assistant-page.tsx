'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  MessageCircle, 
  Lightbulb, 
  TrendingUp, 
  Map,
  Calendar,
  DollarSign,
  Users,
  Settings,
  History,
  Star,
  Zap
} from 'lucide-react';
import { AiChat } from './ai-chat';

interface AiAssistantPageProps {
  currentTrip?: any;
  onSuggestionApply?: (suggestion: any) => void;
}

interface AssistantFeature {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: 'active' | 'coming_soon' | 'beta';
  examples: string[];
}

const assistantFeatures: AssistantFeature[] = [
  {
    id: 'trip-planning',
    title: 'Gezi Planlama Asistanı',
    description: 'AI destekli kişiselleştirilmiş gezi planları oluşturun',
    icon: Calendar,
    status: 'active',
    examples: [
      'İstanbul için 3 günlük plan öner',
      'Bütçe dostu Kapadokya rotası',
      'Aile dostu aktiviteler bul'
    ]
  },
  {
    id: 'budget-optimizer',
    title: 'Bütçe Optimizasyonu',
    description: 'Akıllı bütçe dağılımı ve tasarruf önerileri',
    icon: DollarSign,
    status: 'active',
    examples: [
      'Bütçemi optimize et',
      'En ekonomik ulaşım seçenekleri',
      'Gizli maliyetleri hesapla'
    ]
  },
  {
    id: 'route-optimization',
    title: 'Rota Optimizasyonu',
    description: 'En verimli güzergahları keşfedin',
    icon: Map,
    status: 'beta',
    examples: [
      'Günlük rotamı optimize et',
      'Trafik durumunu dikkate al',
      'Alternatif güzergahlar öner'
    ]
  },
  {
    id: 'local-insights',
    title: 'Yerel İçgörüler',
    description: 'Yerli uzmanlardan öneriler ve ipuçları',
    icon: Lightbulb,
    status: 'coming_soon',
    examples: [
      'Yerel festivaller hakkında bilgi',
      'Gizli kalmiş mekanlar',
      'Kültürel etkinlik önerileri'
    ]
  },
  {
    id: 'real-time-assistance',
    title: 'Anlık Yardım',
    description: 'Seyahat sırasında 7/24 AI desteği',
    icon: Zap,
    status: 'beta',
    examples: [
      'Acil durum yardımı',
      'Dil çevirisi',
      'Anlık yer önerileri'
    ]
  },
  {
    id: 'group-coordination',
    title: 'Grup Koordinasyonu',
    description: 'Grup seyahatlerini organize edin',
    icon: Users,
    status: 'coming_soon',
    examples: [
      'Grup tercihleri analizi',
      'Ortak program oluşturma',
      'Maliyet paylaşımı hesaplama'
    ]
  }
];

export function AiAssistantPage({ currentTrip, onSuggestionApply }: AiAssistantPageProps) {
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Aktif</Badge>;
      case 'beta':
        return <Badge variant="secondary">Beta</Badge>;
      case 'coming_soon':
        return <Badge variant="outline">Yakında</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Bot className="h-8 w-8 text-blue-600" />
                TourTrip AI Asistan
                <Badge variant="outline">Powered by Vertex AI</Badge>
              </h1>
              <p className="text-muted-foreground">
                Yapay zeka destekli seyahat planlama ve kişiselleştirilmiş öneriler
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Sohbet</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Özellikler</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Analitik</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Ayarlar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <AiChat 
              currentTrip={currentTrip}
              onSuggestionSelect={onSuggestionApply}
            />
          </TabsContent>

          <TabsContent value="features">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Asistan Özellikleri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assistantFeatures.map((feature) => {
                      const IconComponent = feature.icon;
                      return (
                        <FeatureCard
                          key={feature.id}
                          feature={feature}
                          isSelected={selectedFeature === feature.id}
                          onSelect={() => setSelectedFeature(
                            selectedFeature === feature.id ? null : feature.id
                          )}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Feature Details */}
              {selectedFeature && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {(() => {
                        const feature = assistantFeatures.find(f => f.id === selectedFeature);
                        const IconComponent = feature?.icon;
                        return (
                          <>
                            {IconComponent && <IconComponent className="h-5 w-5" />}
                            {feature?.title}
                            {getStatusBadge(feature?.status || '')}
                          </>
                        );
                      })()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const feature = assistantFeatures.find(f => f.id === selectedFeature);
                      return (
                        <div className="space-y-4">
                          <p className="text-muted-foreground">{feature?.description}</p>
                          
                          <div>
                            <h4 className="font-medium mb-3">Örnek Komutlar:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              {feature?.examples.map((example, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  className="justify-start text-left h-auto py-2 px-3"
                                  onClick={() => {
                                    setActiveTab('chat');
                                    // TODO: Auto-fill chat input with example
                                  }}
                                >
                                  "{example}"
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <AnalyticsCard
                title="Toplam Sohbet"
                value="247"
                change="+12%"
                icon={MessageCircle}
                color="blue"
              />
              <AnalyticsCard
                title="Uygulanan Öneriler"
                value="89"
                change="+8%"
                icon={Lightbulb}
                color="green"
              />
              <AnalyticsCard
                title="Memnuniyet Skoru"
                value="4.6/5"
                change="+0.2"
                icon={Star}
                color="yellow"
              />
              <AnalyticsCard
                title="Tasarruf Edilen"
                value="₺2,340"
                change="+15%"
                icon={DollarSign}
                color="purple"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Popüler Sorular</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { question: "Bütçe dostu tur önerileri", count: 45 },
                      { question: "Rota optimizasyonu", count: 38 },
                      { question: "Yerel restoran önerileri", count: 32 },
                      { question: "Ulaşım alternatifleri", count: 28 },
                      { question: "Hava durumu bilgisi", count: 24 }
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <span className="text-sm">{item.question}</span>
                        <Badge variant="outline">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Son Aktiviteler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { action: "İstanbul tur planı oluşturuldu", time: "2 saat önce" },
                      { action: "Bütçe optimizasyonu tamamlandı", time: "4 saat önce" },
                      { action: "Rota önerisi uygulandı", time: "6 saat önce" },
                      { action: "Restoran rezervasyonu önerildi", time: "1 gün önce" },
                      { action: "Grup koordinasyonu başlatıldı", time: "2 gün önce" }
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between items-start p-3 rounded-lg bg-muted/50">
                        <span className="text-sm">{item.action}</span>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Asistan Ayarları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Kişiselleştirme</h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Proaktif öneriler</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Bütçe uyarıları</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Yerel içgörüler</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Grup koordinasyonu</span>
                        <input type="checkbox" className="rounded" />
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">İletişim Tercihleri</h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Ses yanıtları</span>
                        <input type="checkbox" className="rounded" />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Emoji kullanımı</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Detaylı açıklamalar</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Gizlilik</h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Sohbet geçmişi saklama</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Kişiselleştirme için veri kullanımı</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Üçüncü taraf paylaşımı</span>
                        <input type="checkbox" className="rounded" />
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex gap-4">
                      <Button>Ayarları Kaydet</Button>
                      <Button variant="outline">
                        <History className="h-4 w-4 mr-2" />
                        Sohbet Geçmişini Temizle
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  key?: string;
  feature: AssistantFeature;
  isSelected: boolean;
  onSelect: () => void;
}

function FeatureCard({ feature, isSelected, onSelect }: FeatureCardProps) {
  const IconComponent = feature.icon;
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${feature.status === 'coming_soon' ? 'opacity-60' : ''}`}
      onClick={feature.status !== 'coming_soon' ? onSelect : undefined}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-lg bg-blue-100">
            <IconComponent className="h-6 w-6 text-blue-600" />
          </div>
          {getStatusBadge(feature.status)}
        </div>
        
        <h3 className="font-semibold mb-2">{feature.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
        
        <div className="text-xs text-muted-foreground">
          <strong>Örnek:</strong> "{feature.examples[0]}"
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge variant="default">Aktif</Badge>;
    case 'beta':
      return <Badge variant="secondary">Beta</Badge>;
    case 'coming_soon':
      return <Badge variant="outline">Yakında</Badge>;
    default:
      return null;
  }
}

interface AnalyticsCardProps {
  title: string;
  value: string;
  change: string;
  icon: any;
  color: string;
}

function AnalyticsCard({ title, value, change, icon: Icon, color }: AnalyticsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-green-600">{change}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



