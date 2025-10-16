'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BookingData } from './booking-flow';
import { User, Phone, Mail, UserPlus, AlertTriangle } from 'lucide-react';

interface BookingStep3Props {
  data: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
}

export function BookingStep3({ data, onUpdate }: BookingStep3Props) {
  const [contactInfo, setContactInfo] = useState(data.contactInfo);
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);

  // Update parent state when contact info changes
  useEffect(() => {
    onUpdate({ contactInfo });
  }, [contactInfo, onUpdate]);

  // Update contact field
  const updateContactField = (field: string, value: string) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Update emergency contact field
  const updateEmergencyContact = (field: string, value: string) => {
    setContactInfo(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value,
      },
    }));
  };

  // Validate email format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone format (Turkish phone format)
  const isValidPhone = (phone: string) => {
    const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // Relationship options for emergency contact
  const relationshipOptions = [
    { value: 'spouse', label: 'Eş' },
    { value: 'parent', label: 'Ebeveyn' },
    { value: 'child', label: 'Çocuk' },
    { value: 'sibling', label: 'Kardeş' },
    { value: 'friend', label: 'Arkadaş' },
    { value: 'other', label: 'Diğer' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">İletişim Bilgileri</h2>
        <p className="text-muted-foreground">
          Rezervasyon onayı ve tur bilgilendirmeleri için iletişim bilgilerinizi girin.
        </p>
      </div>

      {/* Main Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Ana İletişim Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">
                Ad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                value={contactInfo.firstName}
                onChange={(e) => updateContactField('firstName', e.target.value)}
                placeholder="Adınız"
                required
              />
            </div>

            <div>
              <Label htmlFor="lastName">
                Soyad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                value={contactInfo.lastName}
                onChange={(e) => updateContactField('lastName', e.target.value)}
                placeholder="Soyadınız"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">
              E-posta Adresi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={contactInfo.email}
              onChange={(e) => updateContactField('email', e.target.value)}
              placeholder="ornek@email.com"
              required
            />
            {contactInfo.email && !isValidEmail(contactInfo.email) && (
              <p className="text-sm text-destructive mt-1">
                Geçerli bir e-posta adresi girin.
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Rezervasyon onayı ve tur bilgileri bu adrese gönderilecektir.
            </p>
          </div>

          <div>
            <Label htmlFor="phone">
              Telefon Numarası <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={contactInfo.phone}
              onChange={(e) => updateContactField('phone', e.target.value)}
              placeholder="+90 5XX XXX XX XX"
              required
            />
            {contactInfo.phone && !isValidPhone(contactInfo.phone) && (
              <p className="text-sm text-destructive mt-1">
                Geçerli bir telefon numarası girin. (Örn: 05XXXXXXXXX)
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Acil durumlar ve son dakika bilgilendirmeleri için kullanılacaktır.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Acil Durum İletişim
            </CardTitle>
            <Button
              variant={showEmergencyContact ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowEmergencyContact(!showEmergencyContact)}
            >
              {showEmergencyContact ? 'Gizle' : 'Ekle'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Acil durumlarda ulaşılabilecek bir kişinin bilgilerini ekleyin. (Önerilen)
          </p>
        </CardHeader>

        {showEmergencyContact && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="emergencyName">
                Ad Soyad
              </Label>
              <Input
                id="emergencyName"
                value={contactInfo.emergencyContact?.name || ''}
                onChange={(e) => updateEmergencyContact('name', e.target.value)}
                placeholder="Acil durum irtibat kişisi"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyPhone">
                  Telefon Numarası
                </Label>
                <Input
                  id="emergencyPhone"
                  type="tel"
                  value={contactInfo.emergencyContact?.phone || ''}
                  onChange={(e) => updateEmergencyContact('phone', e.target.value)}
                  placeholder="+90 5XX XXX XX XX"
                />
              </div>

              <div>
                <Label htmlFor="emergencyRelationship">
                  Yakınlık Derecesi
                </Label>
                <Select 
                  value={contactInfo.emergencyContact?.relationship || ''} 
                  onValueChange={(value) => updateEmergencyContact('relationship', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Yakınlık derecesini seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Communication Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            İletişim Tercihleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="smsNotifications"
                className="rounded border-gray-300"
                defaultChecked
              />
              <Label htmlFor="smsNotifications" className="text-sm">
                SMS ile tur hatırlatması gönder
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="emailNotifications"
                className="rounded border-gray-300"
                defaultChecked
              />
              <Label htmlFor="emailNotifications" className="text-sm">
                E-posta ile tur bilgilendirmesi gönder
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="whatsappNotifications"
                className="rounded border-gray-300"
                defaultChecked
              />
              <Label htmlFor="whatsappNotifications" className="text-sm">
                WhatsApp ile anlık bildirim gönder
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="marketingEmails"
                className="rounded border-gray-300"
              />
              <Label htmlFor="marketingEmails" className="text-sm">
                Özel kampanya ve fırsatlar hakkında bilgilendir
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Önemli Bilgiler
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-700 space-y-2">
          <p>• Rezervasyon onayı girdiğiniz e-posta adresine gönderilecektir.</p>
          <p>• Tur günü acil durumlar için telefon numaranızın açık olduğundan emin olun.</p>
          <p>• Acil durum irtibat kişisi özellikle uzun süreli turlar için önerilir.</p>
          <p>• İletişim bilgileriniz gizlilik politikamız kapsamında korunmaktadır.</p>
        </CardContent>
      </Card>
    </div>
  );
}
