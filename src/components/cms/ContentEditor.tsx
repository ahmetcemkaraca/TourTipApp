'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  Eye, 
  Globe, 
  Settings, 
  Image,
  FileText,
  Calendar,
  User,
  Tag,
  Link
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { ContentService, CategoryService } from '@/lib/cms-service';
import { ContentPage, ContentCategory, LocalizedContent } from '@/types/cms';

interface ContentEditorProps {
  contentId?: string;
  type: ContentPage['type'];
  onSave?: (content: ContentPage) => void;
  onPublish?: (content: ContentPage) => void;
  readOnly?: boolean;
}

export default function ContentEditor({ 
  contentId, 
  type, 
  onSave, 
  onPublish, 
  readOnly = false 
}: ContentEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<Partial<ContentPage>>({
    type,
    status: 'draft',
    featured: false,
    title: { tr: '' },
    content: { tr: '' },
    tags: [],
    seo: {},
    media: {},
    settings: {
      allowComments: true,
      showAuthor: true,
      showDate: true,
    },
    analytics: {
      views: 0,
      shares: 0,
      readTime: 0,
    },
    workflow: {
      version: 1,
      lastEditedBy: user?.uid || '',
    },
    translations: {},
  });
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [activeTab, setActiveTab] = useState('content');
  const [currentLanguage, setCurrentLanguage] = useState<string>('tr');

  const availableLanguages = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ];

  useEffect(() => {
    loadInitialData();
  }, [contentId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load categories
      const cats = await CategoryService.getCategories(type);
      setCategories(cats);

      // Load existing content
      if (contentId) {
        const existingContent = await ContentService.getContent(contentId);
        if (existingContent) {
          setContent(existingContent);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (status: ContentPage['status'] = 'draft') => {
    if (!user) {
      toast.error('Oturum açmanız gerekiyor');
      return;
    }

    try {
      setSaving(true);

      const contentData = {
        ...content,
        status,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Unknown',
        workflow: {
          ...content.workflow,
          lastEditedBy: user.uid,
          version: (content.workflow?.version || 0) + 1,
        },
      } as Omit<ContentPage, 'id' | 'createdAt' | 'updatedAt'>;

      let savedContent: ContentPage;

      if (contentId) {
        await ContentService.updateContent(contentId, contentData);
        savedContent = (await ContentService.getContent(contentId))!;
      } else {
        savedContent = await ContentService.createContent(contentData);
        // Update URL without reload
        window.history.replaceState({}, '', `/cms/content/edit/${savedContent.id}`);
      }

      setContent(savedContent);
      toast.success(status === 'published' ? 'İçerik yayınlandı' : 'İçerik kaydedildi');

      if (status === 'published' && onPublish) {
        onPublish(savedContent);
      } else if (onSave) {
        onSave(savedContent);
      }
    } catch (error: any) {
      toast.error(error.message || 'Kaydetme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = () => {
    if (!content.title?.tr?.trim()) {
      toast.error('Başlık alanı zorunludur');
      return;
    }
    if (!content.content?.tr?.trim()) {
      toast.error('İçerik alanı zorunludur');
      return;
    }
    handleSave('published');
  };

  const updateLocalizedField = (field: keyof LocalizedContent, value: string) => {
    const fieldName = field === 'title' ? 'title' : field === 'content' ? 'content' : 'excerpt';
    setContent(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        [currentLanguage]: value,
      },
    }));
  };

  const updateSEOField = (field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        [field]: value,
      },
    }));
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">
            {contentId ? 'İçerik Düzenle' : 'Yeni İçerik Oluştur'}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{type}</Badge>
            {content.status && (
              <Badge className={getStatusColor(content.status)}>
                {content.status === 'published' ? 'Yayında' : 
                 content.status === 'draft' ? 'Taslak' : 'Arşivlenmiş'}
              </Badge>
            )}
            {content.featured && <Badge>Öne Çıkan</Badge>}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" disabled={saving}>
            <Eye className="h-4 w-4 mr-2" />
            Önizle
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSave('draft')}
            disabled={saving || readOnly}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
          <Button 
            onClick={handlePublish}
            disabled={saving || readOnly || content.status === 'published'}
          >
            Yayınla
          </Button>
        </div>
      </div>

      {/* Language Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium">Dil:</span>
            <div className="flex gap-2">
              {availableLanguages.map(lang => (
                <Button
                  key={lang.code}
                  variant={currentLanguage === lang.code ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentLanguage(lang.code)}
                >
                  {lang.flag} {lang.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Editor */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">
            <FileText className="h-4 w-4 mr-2" />
            İçerik
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Settings className="h-4 w-4 mr-2" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="media">
            <Image className="h-4 w-4 mr-2" />
            Medya
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Ayarlar
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Başlık ({currentLanguage.toUpperCase()}) *
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg"
                  value={content.title?.[currentLanguage as keyof LocalizedContent] || ''}
                  onChange={(e) => updateLocalizedField('title' as keyof LocalizedContent, e.target.value)}
                  placeholder="İçerik başlığını girin..."
                  disabled={readOnly}
                />
              </div>

              {/* Slug */}
              {currentLanguage === 'tr' && (
                <div>
                  <label className="block text-sm font-medium mb-2">URL Slug</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l border border-r-0 bg-gray-50 text-gray-500 text-sm">
                      /{type}/
                    </span>
                    <input
                      type="text"
                      className="flex-1 p-3 border rounded-r-lg"
                      value={content.slug || ''}
                      onChange={(e) => setContent(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="url-slug"
                      disabled={readOnly}
                    />
                  </div>
                </div>
              )}

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Özet ({currentLanguage.toUpperCase()})
                </label>
                <textarea
                  className="w-full p-3 border rounded-lg h-24"
                  value={content.excerpt?.[currentLanguage as keyof LocalizedContent] || ''}
                  onChange={(e) => updateLocalizedField('excerpt' as keyof LocalizedContent, e.target.value)}
                  placeholder="İçerik özeti..."
                  disabled={readOnly}
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  İçerik ({currentLanguage.toUpperCase()}) *
                </label>
                <textarea
                  className="w-full p-3 border rounded-lg h-96"
                  value={content.content?.[currentLanguage as keyof LocalizedContent] || ''}
                  onChange={(e) => updateLocalizedField('content' as keyof LocalizedContent, e.target.value)}
                  placeholder="İçeriği buraya yazın..."
                  disabled={readOnly}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Markdown formatını destekler
                </p>
              </div>

              {/* Category */}
              {currentLanguage === 'tr' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Kategori</label>
                    <select
                      className="w-full p-3 border rounded-lg"
                      value={content.categoryId || ''}
                      onChange={(e) => setContent(prev => ({ ...prev, categoryId: e.target.value }))}
                      disabled={readOnly}
                    >
                      <option value="">Kategori seçin</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name.tr}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Durum</label>
                    <select
                      className="w-full p-3 border rounded-lg"
                      value={content.status || 'draft'}
                      onChange={(e) => setContent(prev => ({ ...prev, status: e.target.value as ContentPage['status'] }))}
                      disabled={readOnly}
                    >
                      <option value="draft">Taslak</option>
                      <option value="published">Yayında</option>
                      <option value="archived">Arşivlenmiş</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Tags */}
              {currentLanguage === 'tr' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Etiketler</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-lg"
                    value={content.tags?.join(', ') || ''}
                    onChange={(e) => setContent(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    }))}
                    placeholder="etiket1, etiket2, etiket3"
                    disabled={readOnly}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Meta Başlık ({currentLanguage.toUpperCase()})
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg"
                  value={content.seo?.metaTitle?.[currentLanguage as keyof LocalizedContent] || ''}
                  onChange={(e) => updateSEOField('metaTitle', {
                    ...content.seo?.metaTitle,
                    [currentLanguage]: e.target.value
                  })}
                  placeholder="SEO için başlık"
                  disabled={readOnly}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Meta Açıklama ({currentLanguage.toUpperCase()})
                </label>
                <textarea
                  className="w-full p-3 border rounded-lg h-24"
                  value={content.seo?.metaDescription?.[currentLanguage as keyof LocalizedContent] || ''}
                  onChange={(e) => updateSEOField('metaDescription', {
                    ...content.seo?.metaDescription,
                    [currentLanguage]: e.target.value
                  })}
                  placeholder="SEO için açıklama"
                  disabled={readOnly}
                />
              </div>

              {currentLanguage === 'tr' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Anahtar Kelimeler</label>
                    <input
                      type="text"
                      className="w-full p-3 border rounded-lg"
                      value={content.seo?.keywords?.join(', ') || ''}
                      onChange={(e) => updateSEOField('keywords', 
                        e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                      )}
                      placeholder="anahtar, kelimeler"
                      disabled={readOnly}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Canonical URL</label>
                    <input
                      type="url"
                      className="w-full p-3 border rounded-lg"
                      value={content.seo?.canonical || ''}
                      onChange={(e) => updateSEOField('canonical', e.target.value)}
                      placeholder="https://example.com/canonical-url"
                      disabled={readOnly}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="noIndex"
                      checked={content.seo?.noIndex || false}
                      onChange={(e) => updateSEOField('noIndex', e.target.checked)}
                      disabled={readOnly}
                    />
                    <label htmlFor="noIndex" className="text-sm">
                      Arama motorlarında gösterme (noindex)
                    </label>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Medya Dosyaları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Öne Çıkan Görsel</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Görsel yüklemek için tıklayın</p>
                  <p className="text-sm text-gray-400">PNG, JPG, GIF (max. 5MB)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Galeri</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Çoklu görsel yüklemek için tıklayın</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>İçerik Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={content.featured || false}
                    onChange={(e) => setContent(prev => ({ ...prev, featured: e.target.checked }))}
                    disabled={readOnly}
                  />
                  <label htmlFor="featured" className="text-sm">Öne Çıkan İçerik</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allowComments"
                    checked={content.settings?.allowComments || false}
                    onChange={(e) => setContent(prev => ({ 
                      ...prev, 
                      settings: { ...prev.settings, allowComments: e.target.checked }
                    }))}
                    disabled={readOnly}
                  />
                  <label htmlFor="allowComments" className="text-sm">Yorumlara İzin Ver</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showAuthor"
                    checked={content.settings?.showAuthor || false}
                    onChange={(e) => setContent(prev => ({ 
                      ...prev, 
                      settings: { ...prev.settings, showAuthor: e.target.checked }
                    }))}
                    disabled={readOnly}
                  />
                  <label htmlFor="showAuthor" className="text-sm">Yazar Bilgisini Göster</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showDate"
                    checked={content.settings?.showDate || false}
                    onChange={(e) => setContent(prev => ({ 
                      ...prev, 
                      settings: { ...prev.settings, showDate: e.target.checked }
                    }))}
                    disabled={readOnly}
                  />
                  <label htmlFor="showDate" className="text-sm">Tarih Bilgisini Göster</label>
                </div>
              </div>

              {/* Analytics */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">İstatistikler</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {content.analytics?.views || 0}
                    </div>
                    <div className="text-sm text-gray-600">Görüntülenme</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {content.analytics?.shares || 0}
                    </div>
                    <div className="text-sm text-gray-600">Paylaşım</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {content.analytics?.readTime || 0} dk
                    </div>
                    <div className="text-sm text-gray-600">Okuma Süresi</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
