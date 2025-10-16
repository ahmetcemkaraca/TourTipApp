'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, Calendar, Camera, Shield, Loader2 } from 'lucide-react';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır').max(50),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phoneNumber: z.string().min(10, 'Telefon numarası en az 10 haneli olmalıdır').optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.object({
    city: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  preferences: z.object({
    language: z.string().default('tr'),
    currency: z.string().default('TRY'),
    notifications: z.object({
      email: z.boolean().default(true),
      sms: z.boolean().default(false),
      push: z.boolean().default(true),
    }),
  }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      preferences: {
        language: 'tr',
        currency: 'TRY',
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
      },
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      // TODO: Update user profile in Firestore
      console.log('Updating profile:', data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      toast.success('Profil bilgileri güncellendi!');
    } catch (error) {
      toast.error('Profil güncellenirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu en fazla 5MB olabilir.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Sadece resim dosyaları yüklenebilir.');
      return;
    }

    setIsUploading(true);
    try {
      // TODO: Upload to Firebase Storage
      console.log('Uploading photo:', file);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay
      toast.success('Profil fotoğrafı güncellendi!');
    } catch (error) {
      toast.error('Fotoğraf yüklenirken hata oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  const cities = [
    'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya',
    'Şanlıurfa', 'Gaziantep', 'Kocaeli', 'Mersin', 'Diyarbakır', 'Hatay',
    'Manisa', 'Kayseri', 'Samsun', 'Balıkesir', 'Kahramanmaraş', 'Van',
    'Aydın', 'Denizli', 'Muğla', 'Tekirdağ', 'Eskişehir', 'Sakarya'
  ].sort();

  const countries = [
    { code: 'TR', name: 'Türkiye' },
    { code: 'US', name: 'Amerika Birleşik Devletleri' },
    { code: 'DE', name: 'Almanya' },
    { code: 'FR', name: 'Fransa' },
    { code: 'GB', name: 'Birleşik Krallık' },
    { code: 'IT', name: 'İtalya' },
    { code: 'ES', name: 'İspanya' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profil Ayarları
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Photo */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                <AvatarFallback className="text-lg">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="photo-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 hover:opacity-100 cursor-pointer transition-opacity"
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={isUploading}
              />
            </div>
            <div>
              <h3 className="font-medium">{user?.displayName || 'Kullanıcı'}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant={user?.emailVerified ? 'default' : 'secondary'}>
                  {user?.emailVerified ? 'Doğrulanmış' : 'Doğrulanmamış'}
                </Badge>
                <Badge variant="outline">Standart Üye</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Kişisel Bilgiler
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Ad Soyad *</Label>
                <Input
                  id="displayName"
                  {...register('displayName')}
                  className={errors.displayName ? 'border-destructive' : ''}
                />
                {errors.displayName && (
                  <p className="text-sm text-destructive">{errors.displayName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresi *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  E-posta adresi değiştirilemez
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Telefon Numarası</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  {...register('phoneNumber')}
                  placeholder="+90 555 123 45 67"
                  className={errors.phoneNumber ? 'border-destructive' : ''}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Doğum Tarihi</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register('dateOfBirth')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Cinsiyet</Label>
                <Select
                  value={watchedValues.gender || ''}
                  onValueChange={(value) => setValue('gender', value as 'male' | 'female' | 'other')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Erkek</SelectItem>
                    <SelectItem value="female">Kadın</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Adres Bilgileri
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Şehir</Label>
                <Select
                  value={watchedValues.address?.city || ''}
                  onValueChange={(value) => setValue('address.city', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Şehir seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Ülke</Label>
                <Select
                  value={watchedValues.address?.country || 'TR'}
                  onValueChange={(value) => setValue('address.country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ülke seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Tercihler
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Dil</Label>
                <Select
                  value={watchedValues.preferences?.language || 'tr'}
                  onValueChange={(value) => setValue('preferences.language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                    <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                    <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Para Birimi</Label>
                <Select
                  value={watchedValues.preferences?.currency || 'TRY'}
                  onValueChange={(value) => setValue('preferences.currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">₺ Türk Lirası</SelectItem>
                    <SelectItem value="USD">$ US Dollar</SelectItem>
                    <SelectItem value="EUR">€ Euro</SelectItem>
                    <SelectItem value="GBP">£ British Pound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !isDirty}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                'Değişiklikleri Kaydet'
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => window.location.reload()}
            >
              İptal
            </Button>
          </div>

          {/* Security Section */}
          <Separator />
          
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Güvenlik
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Şifre Değiştir</h4>
                  <p className="text-sm text-muted-foreground">
                    Hesabınızın güvenliği için düzenli olarak şifre değiştirin
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Şifre Değiştir
                </Button>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">İki Faktörlü Doğrulama</h4>
                  <p className="text-sm text-muted-foreground">
                    Hesabınızı ekstra güvenlik katmanı ile koruyun
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Aktifleştir
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
