'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ContentEditor from '@/components/cms/ContentEditor';
import { 
  FileText, 
  Folder, 
  Image,
  Menu,
  Settings,
  BarChart3,
  Plus,
  Search,
  Filter,
  Globe,
  Users,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Archive,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { ContentService, CategoryService, MediaService, ContentAnalyticsService } from '@/lib/cms-service';
import { ContentPage, ContentCategory, ContentAnalytics } from '@/types/cms';

export default function CMSPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<ContentAnalytics | null>(null);
  const [recentContent, setRecentContent] = useState<ContentPage[]>([]);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingContent, setEditingContent] = useState<string | undefined>();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simulated data - in real app this would come from services
      setAnalytics({
        totalPages: 0,
        publishedPages: 0,
        draftPages: 0,
        totalViews: 0,
        popularContent: [],
        contentByType: {},
        contentByLanguage: { tr: 0 },
        monthlyViews: [],
        authorStats: [],
      });

      setRecentContent([]);
      setCategories([]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : date;
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      page: 'bg-blue-100 text-blue-800',
      blog: 'bg-green-100 text-green-800',
      guide: 'bg-purple-100 text-purple-800',
      help: 'bg-orange-100 text-orange-800',
      legal: 'bg-gray-100 text-gray-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (showEditor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowEditor(false);
              setEditingContent(undefined);
            }}
          >
            ← CMS Dashboard'a Dön
          </Button>
        </div>
        <ContentEditor
          contentId={editingContent}
          type="page"
          onSave={() => {
            setShowEditor(false);
            setEditingContent(undefined);
            loadDashboardData();
          }}
          onPublish={() => {
            setShowEditor(false);
            setEditingContent(undefined);
            loadDashboardData();
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <FileText className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">TourTrip CMS Dashboard</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          İçerik yönetimi sistemi ile web sitenizin tüm içeriklerini yönetin. 
          Çoklu dil desteği, SEO optimizasyonu ve gelişmiş editör özellikleri.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4">
        <Button onClick={() => setShowEditor(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni İçerik
        </Button>
        <Button variant="outline">
          <Image className="h-4 w-4 mr-2" />
          Medya Yükle
        </Button>
        <Button variant="outline">
          <Folder className="h-4 w-4 mr-2" />
          Kategori Ekle
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam İçerik</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Yayında</p>
                <p className="text-2xl font-bold text-green-600">-</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taslak</p>
                <p className="text-2xl font-bold text-yellow-600">-</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Görüntülenme</p>
                <p className="text-2xl font-bold text-purple-600">-</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="content">İçerik</TabsTrigger>
          <TabsTrigger value="categories">Kategoriler</TabsTrigger>
          <TabsTrigger value="media">Medya</TabsTrigger>
          <TabsTrigger value="menus">Menüler</TabsTrigger>
          <TabsTrigger value="settings">Ayarlar</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Son İçerikler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentContent.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Henüz içerik bulunmuyor. İlk içeriğinizi oluşturun!
                    </p>
                  ) : (
                    recentContent.map((content) => (
                      <div key={content.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(content.status)}
                          <div>
                            <p className="font-medium">{content.title.tr}</p>
                            <p className="text-sm text-gray-500">
                              {content.authorName} • {formatDate(content.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getTypeColor(content.type)}>
                            {content.type}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Popular Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Popüler İçerik
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.popularContent.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Analitik verisi bulunmuyor
                    </p>
                  ) : (
                    analytics?.popularContent.map((content, index) => (
                      <div key={content.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{content.title}</p>
                            <p className="text-sm text-gray-500">{content.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">{content.views}</p>
                          <p className="text-xs text-gray-500">görüntülenme</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>İçerik Türü Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(analytics?.contentByType || {}).map(([type, count]) => (
                  <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{count}</div>
                    <div className="text-sm text-gray-600 capitalize">{type}</div>
                  </div>
                ))}
                {Object.keys(analytics?.contentByType || {}).length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    Veri bulunmuyor
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>İçerik Yönetimi</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Ara
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrele
                  </Button>
                  <Button size="sm" onClick={() => setShowEditor(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">Henüz İçerik Yok</h3>
                  <p className="mb-4">İlk içeriğinizi oluşturmak için butona tıklayın</p>
                  <Button onClick={() => setShowEditor(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    İlk İçeriği Oluştur
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Kategori Yönetimi</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Kategori
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Folder className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">Kategori Bulunamadı</h3>
                <p className="mb-4">İçeriklerinizi organize etmek için kategoriler oluşturun</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Kategoriyi Oluştur
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Medya Kütüphanesi</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Medya Yükle
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Image className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">Medya Dosyası Yok</h3>
                <p className="mb-4">Görsel, video ve diğer medya dosyalarınızı yükleyin</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Medyayı Yükle
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Menus Tab */}
        <TabsContent value="menus" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Menü Yönetimi</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Menü
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Menu className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">Menü Bulunamadı</h3>
                <p className="mb-4">Sitenizin navigasyonu için menüler oluşturun</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Menüyü Oluştur
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CMS Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Genel Ayarlar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Site Adı</label>
                    <input
                      type="text"
                      className="w-full p-3 border rounded-lg"
                      defaultValue="TourTrip"
                      placeholder="Site adını girin"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Varsayılan Dil</label>
                    <select className="w-full p-3 border rounded-lg">
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">İçerik Ayarları</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="enableRevisions" defaultChecked />
                    <label htmlFor="enableRevisions" className="text-sm">Sürüm geçmişini etkinleştir</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="enableComments" defaultChecked />
                    <label htmlFor="enableComments" className="text-sm">Yorumları etkinleştir</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="moderateComments" defaultChecked />
                    <label htmlFor="moderateComments" className="text-sm">Yorumları modere et</label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">SEO Ayarları</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Varsayılan Meta Başlık</label>
                    <input
                      type="text"
                      className="w-full p-3 border rounded-lg"
                      defaultValue="TourTrip - Tur ve Gezi Platformu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Varsayılan Meta Açıklama</label>
                    <textarea
                      className="w-full p-3 border rounded-lg h-24"
                      defaultValue="En iyi tur ve gezi deneyimleri için TourTrip"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button>Ayarları Kaydet</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle>CMS Sistem Özellikleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✅ Tamamlanan Özellikler</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Çoklu dil içerik yönetimi</li>
                <li>• SEO optimizasyon araçları</li>
                <li>• İçerik editörü (Markdown desteği)</li>
                <li>• Kategori yönetimi</li>
                <li>• Medya kütüphanesi</li>
                <li>• İçerik şablonları</li>
                <li>• Menü yönetimi</li>
                <li>• FAQ yönetimi</li>
                <li>• Duyuru sistemi</li>
                <li>• İçerik revizyonları</li>
                <li>• Firestore entegrasyonu</li>
                <li>• Cloud Functions otomasyonu</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">🔄 Geliştirme Aşamasında</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• WYSIWYG editör entegrasyonu</li>
                <li>• Dosya yükleme sistemi</li>
                <li>• İçerik iş akışı (workflow)</li>
                <li>• Çeviri yönetimi</li>
                <li>• İçerik analitikleri</li>
                <li>• Yorum yönetimi</li>
                <li>• İçerik planlama takvimi</li>
                <li>• Tema yönetimi</li>
                <li>• İçerik içe/dışa aktarma</li>
                <li>• Gelişmiş arama ve filtreleme</li>
                <li>• Rol tabanlı yetki sistemi</li>
                <li>• Sosyal medya entegrasyonu</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
