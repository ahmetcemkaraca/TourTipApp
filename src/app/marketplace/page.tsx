'use client';

// Marketplace demo page
import React, { useState, useEffect } from 'react';
import MarketplaceView from '@/components/marketplace/MarketplaceView';
import RestaurantCard from '@/components/marketplace/RestaurantCard';
import ShopCard from '@/components/marketplace/ShopCard';
import { Restaurant, Shop } from '@/lib/firestore-collections';
import { Coordinates } from '@/types/location';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Store, Utensils, Package } from 'lucide-react';

// Note: This is a demo page - real data would come from Firestore

export default function MarketplacePage() {
  const [userLocation, setUserLocation] = useState<Coordinates>({ 
    latitude: 41.0082, 
    longitude: 28.9784 // Istanbul default
  });

  const [activeDemo, setActiveDemo] = useState<'overview'>('overview');

  useEffect(() => {
    // Try to get user's actual location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied, using default location');
        }
      );
    }
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Marketplace Demo</h1>
        <p className="text-gray-600">
          Restaurant ve mağaza marketplace sistemi demo sayfası
        </p>
      </div>

      {/* Stats - Demo stats, would come from real data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <Utensils className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <div className="text-2xl font-bold">-</div>
            <div className="text-sm text-gray-600">Restoranlar</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Store className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">-</div>
            <div className="text-sm text-gray-600">Mağazalar</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">-</div>
            <div className="text-sm text-gray-600">Ürün Kategorisi</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="h-8 w-8 mx-auto text-red-500 mb-2" />
            <div className="text-2xl font-bold">-</div>
            <div className="text-sm text-gray-600">Teslimat Yarıçapı</div>
          </CardContent>
        </Card>
      </div>

      {/* Marketplace Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Marketplace Ana Görünüm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Kullanıcıların restaurant ve mağazaları arayabileceği, filtreleyebileceği ve 
            sipariş verebileceği ana marketplace bileşeni.
          </p>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>Geo-location tabanlı arama</Badge>
              <Badge>Gerçek zamanlı filtreleme</Badge>
              <Badge>Mesafe hesaplama</Badge>
              <Badge>Puan sıralama</Badge>
              <Badge>Açık/kapalı durumu</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <MarketplaceView userLocation={userLocation} />

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Marketplace Özellikleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🗺️ Geo-location</h4>
              <p className="text-sm text-gray-600">
                Kullanıcı konumuna göre yakındaki restaurant ve mağazaları bulma
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🔍 Gelişmiş Arama</h4>
              <p className="text-sm text-gray-600">
                Mesafe, puan, kategori ve özellik filtreleri ile arama
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">⏰ Gerçek Zamanlı</h4>
              <p className="text-sm text-gray-600">
                Açık/kapalı durumu, teslimat süreleri ve stok bilgileri
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🛒 Sipariş Yönetimi</h4>
              <p className="text-sm text-gray-600">
                Cloud Functions ile otomatik sipariş işleme ve stok yönetimi
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">📱 Responsive Design</h4>
              <p className="text-sm text-gray-600">
                Mobil ve desktop cihazlarda optimal kullanıcı deneyimi
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🔔 Bildirimler</h4>
              <p className="text-sm text-gray-600">
                Sipariş durumu, stok uyarıları ve promosyon bildirimleri
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
