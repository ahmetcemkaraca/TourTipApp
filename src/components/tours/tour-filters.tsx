'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Filter } from 'lucide-react';

interface TourFiltersProps {
  priceRange: { min: number; max: number };
  onPriceRangeChange: (range: { min: number; max: number }) => void;
  onApply: () => void;
}

export function TourFilters({ priceRange, onPriceRangeChange, onApply }: TourFiltersProps) {
  const [localPriceRange, setLocalPriceRange] = useState([priceRange.min, priceRange.max]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);

  const durations = [
    { id: '1-3', label: '1-3 Saat', value: '1-3' },
    { id: '4-8', label: '4-8 Saat', value: '4-8' },
    { id: '1day', label: '1 Gün', value: '1day' },
    { id: '2-3days', label: '2-3 Gün', value: '2-3days' },
    { id: '1week', label: '1 Hafta+', value: '1week' },
  ];

  const features = [
    { id: 'guide', label: 'Rehber Eşliğinde', value: 'guide' },
    { id: 'food', label: 'Yemek Dahil', value: 'food' },
    { id: 'transport', label: 'Ulaşım Dahil', value: 'transport' },
    { id: 'hotel', label: 'Konaklama Dahil', value: 'hotel' },
    { id: 'equipment', label: 'Ekipman Dahil', value: 'equipment' },
    { id: 'insurance', label: 'Sigorta Dahil', value: 'insurance' },
    { id: 'photo', label: 'Fotoğraf Servisi', value: 'photo' },
    { id: 'pickup', label: 'Oteliden Alım', value: 'pickup' },
  ];

  const ratings = [
    { id: '4.5', label: '4.5 ve üzeri', value: '4.5' },
    { id: '4.0', label: '4.0 ve üzeri', value: '4.0' },
    { id: '3.5', label: '3.5 ve üzeri', value: '3.5' },
    { id: '3.0', label: '3.0 ve üzeri', value: '3.0' },
  ];

  const handleDurationChange = (durationValue: string, checked: boolean) => {
    if (checked) {
      setSelectedDurations(prev => [...prev, durationValue]);
    } else {
      setSelectedDurations(prev => prev.filter(d => d !== durationValue));
    }
  };

  const handleFeatureChange = (featureValue: string, checked: boolean) => {
    if (checked) {
      setSelectedFeatures(prev => [...prev, featureValue]);
    } else {
      setSelectedFeatures(prev => prev.filter(f => f !== featureValue));
    }
  };

  const handleRatingChange = (ratingValue: string, checked: boolean) => {
    if (checked) {
      setSelectedRatings(prev => [...prev, ratingValue]);
    } else {
      setSelectedRatings(prev => prev.filter(r => r !== ratingValue));
    }
  };

  const handlePriceChange = (value: number[]) => {
    setLocalPriceRange(value);
  };

  const handleApplyFilters = () => {
    onPriceRangeChange({
      min: localPriceRange[0],
      max: localPriceRange[1],
    });
    onApply();
  };

  const handleClearFilters = () => {
    setLocalPriceRange([0, 5000]);
    setSelectedDurations([]);
    setSelectedFeatures([]);
    setSelectedRatings([]);
    onPriceRangeChange({ min: 0, max: 5000 });
    onApply();
  };

  const activeFiltersCount = selectedDurations.length + selectedFeatures.length + selectedRatings.length + 
    (localPriceRange[0] > 0 || localPriceRange[1] < 5000 ? 1 : 0);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Gelişmiş Filtreler
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            disabled={activeFiltersCount === 0}
          >
            <X className="mr-1 h-4 w-4" />
            Temizle
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Price Range */}
        <div>
          <Label className="text-base font-medium mb-3 block">
            Fiyat Aralığı: ₺{localPriceRange[0].toLocaleString()} - ₺{localPriceRange[1].toLocaleString()}
          </Label>
          <div className="px-2">
            <Slider
              value={localPriceRange}
              onValueChange={handlePriceChange}
              max={5000}
              min={0}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>₺0</span>
              <span>₺5.000+</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Duration */}
        <div>
          <Label className="text-base font-medium mb-3 block">Süre</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {durations.map((duration) => (
              <div key={duration.id} className="flex items-center space-x-2">
                <Checkbox
                  id={duration.id}
                  checked={selectedDurations.includes(duration.value)}
                  onCheckedChange={(checked) => 
                    handleDurationChange(duration.value, checked === true)
                  }
                />
                <Label
                  htmlFor={duration.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {duration.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Features */}
        <div>
          <Label className="text-base font-medium mb-3 block">Özellikler</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {features.map((feature) => (
              <div key={feature.id} className="flex items-center space-x-2">
                <Checkbox
                  id={feature.id}
                  checked={selectedFeatures.includes(feature.value)}
                  onCheckedChange={(checked) => 
                    handleFeatureChange(feature.value, checked === true)
                  }
                />
                <Label
                  htmlFor={feature.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {feature.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Rating */}
        <div>
          <Label className="text-base font-medium mb-3 block">Değerlendirme</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ratings.map((rating) => (
              <div key={rating.id} className="flex items-center space-x-2">
                <Checkbox
                  id={rating.id}
                  checked={selectedRatings.includes(rating.value)}
                  onCheckedChange={(checked) => 
                    handleRatingChange(rating.value, checked === true)
                  }
                />
                <Label
                  htmlFor={rating.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {rating.label} ⭐
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        <div className="pt-4">
          <Button onClick={handleApplyFilters} className="w-full">
            Filtreleri Uygula
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
