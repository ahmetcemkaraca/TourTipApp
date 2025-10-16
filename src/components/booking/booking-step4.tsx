'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ServiceListing } from '@/lib/firestore-collections';
import { BookingData } from './booking-flow';
import { 
  Shield, 
  Plus, 
  Minus, 
  Camera, 
  Utensils, 
  Car, 
  MapPin,
  Gift,
  Headphones,
  Umbrella,
  Heart,
  Info
} from 'lucide-react';

interface BookingStep4Props {
  tour: ServiceListing;
  data: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ElementType;
  category: 'food' | 'transport' | 'equipment' | 'service' | 'souvenir';
  maxQuantity: number;
  popular?: boolean;
}

interface InsuranceOption {
  type: string;
  name: string;
  description: string;
  coverage: number;
  premium: number;
  features: string[];
  recommended?: boolean;
}

export function BookingStep4({ tour, data, onUpdate }: BookingStep4Props) {
  const [addOns, setAddOns] = useState(data.addOns);
  const [insurance, setInsurance] = useState(data.insurance);
  const [specialRequests, setSpecialRequests] = useState(data.specialRequests);

  // Available add-ons (mock data - in real app, fetch from Firestore)
  const availableAddOns: AddOn[] = [
    {
      id: 'photo-service',
      name: 'Profesyonel Fotoğraf Çekimi',
      description: 'Deneyimli fotoğrafçı eşliğinde profesyonel fotoğraf çekimi',
      price: 150,
      icon: Camera,
      category: 'service',
      maxQuantity: 1,
      popular: true,
    },
    {
      id: 'lunch-premium',
      name: 'Premium Öğle Yemeği',
      description: 'Yerel lezzetlerden oluşan özel menü',
      price: 75,
      icon: Utensils,
      category: 'food',
      maxQuantity: 10,
    },
    {
      id: 'private-transport',
      name: 'Özel Araç Transferi',
      description: 'Otelinden alım ve bırakım hizmeti',
      price: 200,
      icon: Car,
      category: 'transport',
      maxQuantity: 1,
      popular: true,
    },
    {
      id: 'audio-guide',
      name: 'Sesli Rehber',
      description: 'Çoklu dil desteği ile sesli rehberlik',
      price: 25,
      icon: Headphones,
      category: 'equipment',
      maxQuantity: 10,
    },
    {
      id: 'souvenir-package',
      name: 'Hatıra Paketi',
      description: 'Yerel el sanatları ve hatıra ürünleri',
      price: 50,
      icon: Gift,
      category: 'souvenir',
      maxQuantity: 5,
    },
    {
      id: 'weather-protection',
      name: 'Hava Koruması',
      description: 'Şemsiye, yağmurluk ve güneş kremi seti',
      price: 30,
      icon: Umbrella,
      category: 'equipment',
      maxQuantity: 10,
    },
  ];

  // Insurance options (mock data)
  const insuranceOptions: InsuranceOption[] = [
    {
      type: 'basic',
      name: 'Temel Sigorta',
      description: 'Temel kaza ve sağlık güvencesi',
      coverage: 10000,
      premium: 25,
      features: [
        'Kaza güvencesi (10.000 TL)',
        'Temel sağlık koruması',
        'Acil müdahale',
      ],
    },
    {
      type: 'standard',
      name: 'Standart Sigorta',
      description: 'Genişletilmiş koruma ve iptal güvencesi',
      coverage: 25000,
      premium: 45,
      features: [
        'Kaza güvencesi (25.000 TL)',
        'Kapsamlı sağlık koruması',
        'İptal güvencesi (%80)',
        'Bagaj güvencesi',
        'Gecikmeli başlangıç koruması',
      ],
      recommended: true,
    },
    {
      type: 'premium',
      name: 'Premium Sigorta',
      description: 'En kapsamlı koruma ve ek hizmetler',
      coverage: 50000,
      premium: 75,
      features: [
        'Kaza güvencesi (50.000 TL)',
        'Tam sağlık koruması',
        'İptal güvencesi (%100)',
        'Kapsamlı bagaj güvencesi',
        'Alternatif tur garantisi',
        '7/24 acil yardım hattı',
        'Yasal destek',
      ],
    },
  ];

  // Update parent state when data changes
  useEffect(() => {
    onUpdate({ addOns, insurance, specialRequests });
  }, [addOns, insurance, specialRequests, onUpdate]);

  // Handle add-on quantity change
  const updateAddOnQuantity = (addOnId: string, change: number) => {
    const addOn = availableAddOns.find(a => a.id === addOnId);
    if (!addOn) return;

    setAddOns(prev => {
      const existing = prev.find(a => a.id === addOnId);
      
      if (existing) {
        const newQuantity = Math.max(0, Math.min(addOn.maxQuantity, existing.quantity + change));
        
        if (newQuantity === 0) {
          return prev.filter(a => a.id !== addOnId);
        } else {
          return prev.map(a => a.id === addOnId ? { ...a, quantity: newQuantity } : a);
        }
      } else if (change > 0) {
        return [...prev, {
          id: addOn.id,
          name: addOn.name,
          price: addOn.price,
          quantity: 1,
        }];
      }
      
      return prev;
    });
  };

  // Get add-on quantity
  const getAddOnQuantity = (addOnId: string) => {
    const addOn = addOns.find(a => a.id === addOnId);
    return addOn ? addOn.quantity : 0;
  };

  // Handle insurance selection
  const selectInsurance = (option: InsuranceOption) => {
    if (insurance?.type === option.type) {
      setInsurance(undefined);
    } else {
      setInsurance({
        type: option.type,
        coverage: option.coverage,
        premium: option.premium,
      });
    }
  };

  // Format price
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: data.currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Group add-ons by category
  const groupedAddOns = availableAddOns.reduce((groups, addOn) => {
    if (!groups[addOn.category]) {
      groups[addOn.category] = [];
    }
    groups[addOn.category].push(addOn);
    return groups;
  }, {} as Record<string, AddOn[]>);

  const categoryNames = {
    service: 'Hizmetler',
    food: 'Yiyecek & İçecek',
    transport: 'Ulaşım',
    equipment: 'Ekipman',
    souvenir: 'Hatıra',
  };

  // Calculate totals
  const addOnsTotal = addOns.reduce((sum, addOn) => sum + (addOn.price * addOn.quantity), 0);
  const insuranceTotal = insurance?.premium || 0;
  const extrasTotal = addOnsTotal + insuranceTotal;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Ek Hizmetler</h2>
        <p className="text-muted-foreground">
          Tur deneyiminizi zenginleştirmek için ek hizmetler seçebilirsiniz.
        </p>
      </div>

      {/* Add-Ons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ek Hizmetler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedAddOns).map(([category, categoryAddOns]) => (
            <div key={category}>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                {categoryNames[category as keyof typeof categoryNames]}
                <Badge variant="outline" className="text-xs">
                  {categoryAddOns.length} seçenek
                </Badge>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryAddOns.map((addOn) => {
                  const Icon = addOn.icon;
                  const quantity = getAddOnQuantity(addOn.id);
                  
                  return (
                    <div 
                      key={addOn.id} 
                      className={`border rounded-lg p-4 transition-colors ${
                        quantity > 0 ? 'border-primary bg-primary/5' : 'border-muted'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h5 className="font-medium flex items-center gap-2">
                              {addOn.name}
                              {addOn.popular && (
                                <Badge variant="secondary" className="text-xs">
                                  Popüler
                                </Badge>
                              )}
                            </h5>
                            <p className="text-sm text-muted-foreground">
                              {addOn.description}
                            </p>
                            <p className="text-sm font-medium text-primary mt-1">
                              {formatPrice(addOn.price)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateAddOnQuantity(addOn.id, -1)}
                            disabled={quantity === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <span className="w-8 text-center font-medium">
                            {quantity}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateAddOnQuantity(addOn.id, 1)}
                            disabled={quantity >= addOn.maxQuantity}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {quantity > 0 && (
                          <span className="font-medium text-primary">
                            {formatPrice(addOn.price * quantity)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator className="mt-6" />
            </div>
          ))}

          {addOns.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Ek Hizmetler Toplamı:</span>
                <span className="font-bold text-primary">
                  {formatPrice(addOnsTotal)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insurance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Seyahat Sigortası
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Beklenmedik durumlar için kendinizi güvence altına alın.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insuranceOptions.map((option) => (
              <div
                key={option.type}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  insurance?.type === option.type
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-primary/50'
                } ${option.recommended ? 'ring-2 ring-primary/20' : ''}`}
                onClick={() => selectInsurance(option)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    {option.name}
                    {option.recommended && (
                      <Badge className="text-xs">
                        <Heart className="h-3 w-3 mr-1" />
                        Önerilen
                      </Badge>
                    )}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={insurance?.type === option.type}
                      onChange={() => selectInsurance(option)}
                    />
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {option.description}
                </p>
                
                <div className="space-y-2 mb-3">
                  {option.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <div className="w-1 h-1 bg-primary rounded-full"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="text-lg font-bold text-primary">
                  {formatPrice(option.premium)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Special Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Özel İstekler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="specialRequests" className="mb-2 block">
            Özel istek veya notlarınızı buraya yazabilirsiniz
          </Label>
          <Textarea
            id="specialRequests"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Örnek: Vejetaryen menü, engelli erişimi, özel gün kutlaması, alerjiler vb."
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Özel istekleriniz mümkün olduğunca karşılanmaya çalışılacaktır. Ek ücret gerektirebilir.
          </p>
        </CardContent>
      </Card>

      {/* Total Summary */}
      {extrasTotal > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Ek Hizmetler:</span>
                <span>{formatPrice(addOnsTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Sigorta:</span>
                <span>{formatPrice(insuranceTotal)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Ekstra Toplam:</span>
                <span className="text-primary">{formatPrice(extrasTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
