'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Mail, Phone, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const customerInfoSchema = z.object({
  name: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().min(10, 'Telefon numarası en az 10 haneli olmalıdır'),
  address: z.object({
    line1: z.string().min(5, 'Adres en az 5 karakter olmalıdır'),
    line2: z.string().optional(),
    city: z.string().min(2, 'Şehir adı giriniz'),
    postal_code: z.string().min(5, 'Posta kodu giriniz'),
    country: z.string().min(2, 'Ülke seçiniz'),
  }),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'Kullanım şartlarını kabul etmelisiniz',
  }),
  marketingConsent: z.boolean().optional(),
});

type CustomerInfoFormData = z.infer<typeof customerInfoSchema>;

interface CustomerInfoFormProps {
  initialData: Omit<CustomerInfoFormData, 'termsAccepted' | 'marketingConsent'>;
  onSubmit: (data: Omit<CustomerInfoFormData, 'termsAccepted' | 'marketingConsent'>) => void;
  isLoading: boolean;
  onBack: () => void;
}

export function CustomerInfoForm({ 
  initialData, 
  onSubmit, 
  isLoading, 
  onBack 
}: CustomerInfoFormProps) {
  const [showBillingAddress, setShowBillingAddress] = useState(
    Boolean(initialData.address?.line1)
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<CustomerInfoFormData>({
    resolver: zodResolver(customerInfoSchema),
    defaultValues: {
      ...initialData,
      termsAccepted: false,
      marketingConsent: false,
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  const turkishCities = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya',
    'Artvin', 'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu',
    'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır',
    'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun',
    'Gümüşhane', 'Hakkâri', 'Hatay', 'Isparta', 'İçel', 'İstanbul', 'İzmir',
    'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya',
    'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş',
    'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop',
    'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak',
    'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale',
    'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük',
    'Kilis', 'Osmaniye', 'Düzce'
  ].sort();

  const countries = [
    { code: 'TR', name: 'Türkiye' },
    { code: 'US', name: 'Amerika Birleşik Devletleri' },
    { code: 'DE', name: 'Almanya' },
    { code: 'FR', name: 'Fransa' },
    { code: 'GB', name: 'Birleşik Krallık' },
    { code: 'IT', name: 'İtalya' },
    { code: 'ES', name: 'İspanya' },
    { code: 'NL', name: 'Hollanda' },
    { code: 'BE', name: 'Belçika' },
    { code: 'CH', name: 'İsviçre' },
    { code: 'AT', name: 'Avusturya' },
    { code: 'SE', name: 'İsveç' },
    { code: 'NO', name: 'Norveç' },
    { code: 'DK', name: 'Danimarka' },
    { code: 'FI', name: 'Finlandiya' },
  ];

  const onFormSubmit = (data: CustomerInfoFormData) => {
    const { termsAccepted, marketingConsent, ...formData } = data;
    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            İletişim Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Ad Soyad *
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Ahmet Yılmaz"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-posta Adresi *
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="ahmet@example.com"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefon Numarası *
              </Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                placeholder="+90 555 123 45 67"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Rezervasyon güncellemeleri için kullanılacaktır.
              </p>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-base font-medium">
                  <MapPin className="h-4 w-4" />
                  Fatura Adresi
                </Label>
                <Checkbox
                  checked={showBillingAddress}
                  onCheckedChange={setShowBillingAddress}
                />
              </div>

              {showBillingAddress && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="space-y-2">
                    <Label htmlFor="address.line1">Adres Satırı 1 *</Label>
                    <Input
                      id="address.line1"
                      {...register('address.line1')}
                      placeholder="Mahalle, sokak, apartman adı, kapı no"
                      className={errors.address?.line1 ? 'border-destructive' : ''}
                    />
                    {errors.address?.line1 && (
                      <p className="text-sm text-destructive">{errors.address.line1.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address.line2">Adres Satırı 2</Label>
                    <Input
                      id="address.line2"
                      {...register('address.line2')}
                      placeholder="Daire no, kat (opsiyonel)"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address.city">Şehir *</Label>
                      <Select
                        value={watchedValues.address?.city || ''}
                        onValueChange={(value) => setValue('address.city', value)}
                      >
                        <SelectTrigger className={errors.address?.city ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Şehir seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {turkishCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.address?.city && (
                        <p className="text-sm text-destructive">{errors.address.city.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address.postal_code">Posta Kodu *</Label>
                      <Input
                        id="address.postal_code"
                        {...register('address.postal_code')}
                        placeholder="34000"
                        className={errors.address?.postal_code ? 'border-destructive' : ''}
                      />
                      {errors.address?.postal_code && (
                        <p className="text-sm text-destructive">{errors.address.postal_code.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address.country">Ülke *</Label>
                      <Select
                        value={watchedValues.address?.country || 'TR'}
                        onValueChange={(value) => setValue('address.country', value)}
                      >
                        <SelectTrigger className={errors.address?.country ? 'border-destructive' : ''}>
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
                      {errors.address?.country && (
                        <p className="text-sm text-destructive">{errors.address.country.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Terms and Consents */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="termsAccepted"
                  checked={watchedValues.termsAccepted || false}
                  onCheckedChange={(checked) => setValue('termsAccepted', checked as boolean)}
                  className={errors.termsAccepted ? 'border-destructive' : ''}
                />
                <div className="space-y-1">
                  <Label htmlFor="termsAccepted" className="text-sm font-normal cursor-pointer">
                    <a href="/terms" className="text-primary hover:underline" target="_blank">
                      Kullanım Şartları
                    </a>{' '}
                    ve{' '}
                    <a href="/privacy" className="text-primary hover:underline" target="_blank">
                      Gizlilik Politikası
                    </a>nı okudum ve kabul ediyorum. *
                  </Label>
                  {errors.termsAccepted && (
                    <p className="text-xs text-destructive">{errors.termsAccepted.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="marketingConsent"
                  checked={watchedValues.marketingConsent || false}
                  onCheckedChange={(checked) => setValue('marketingConsent', checked as boolean)}
                />
                <Label htmlFor="marketingConsent" className="text-sm font-normal cursor-pointer">
                  Kampanya, indirim ve yeni tur duyurularını e-posta ile almayı kabul ediyorum.
                </Label>
              </div>
            </div>

            {/* Form Validation Summary */}
            {Object.keys(errors).length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  Lütfen tüm zorunlu alanları doğru şekilde doldurun.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isLoading}
                className="flex-1"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Sepete Dön
              </Button>
              
              <Button
                type="submit"
                disabled={!isValid || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    Ödemeye Geç
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
