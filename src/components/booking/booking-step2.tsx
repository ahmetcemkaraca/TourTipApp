'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookingData } from './booking-flow';
import { User, Users, Plus, Trash2, Baby } from 'lucide-react';

interface BookingStep2Props {
  data: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
}

export function BookingStep2({ data, onUpdate }: BookingStep2Props) {
  const [participants, setParticipants] = useState(data.participants);

  // Initialize participants when step loads
  useEffect(() => {
    const totalNeeded = data.adults + data.children;
    
    if (participants.length < totalNeeded) {
      const newParticipants = [...participants];
      
      // Add missing adult participants
      const currentAdults = participants.filter(p => p.type === 'adult').length;
      for (let i = currentAdults; i < data.adults; i++) {
        newParticipants.push({
          type: 'adult',
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          passportNumber: '',
          specialRequests: '',
        });
      }
      
      // Add missing child participants
      const currentChildren = participants.filter(p => p.type === 'child').length;
      for (let i = currentChildren; i < data.children; i++) {
        newParticipants.push({
          type: 'child',
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          passportNumber: '',
          specialRequests: '',
        });
      }
      
      setParticipants(newParticipants);
    } else if (participants.length > totalNeeded) {
      // Remove excess participants
      const adults = participants.filter(p => p.type === 'adult').slice(0, data.adults);
      const children = participants.filter(p => p.type === 'child').slice(0, data.children);
      setParticipants([...adults, ...children]);
    }
  }, [data.adults, data.children]);

  // Update parent state when participants change
  useEffect(() => {
    onUpdate({ participants });
  }, [participants, onUpdate]);

  // Update participant data
  const updateParticipant = (index: number, field: string, value: string) => {
    const updatedParticipants = [...participants];
    updatedParticipants[index] = {
      ...updatedParticipants[index],
      [field]: value,
    };
    setParticipants(updatedParticipants);
  };

  // Get participant display name
  const getParticipantDisplayName = (participant: typeof participants[0], index: number) => {
    if (participant.firstName || participant.lastName) {
      return `${participant.firstName} ${participant.lastName}`.trim();
    }
    return `${participant.type === 'adult' ? 'Yetişkin' : 'Çocuk'} ${index + 1}`;
  };

  // Get minimum date for birth date (100 years ago)
  const getMinBirthDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 100);
    return date.toISOString().split('T')[0];
  };

  // Get maximum date for birth date (today)
  const getMaxBirthDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const adults = participants.filter(p => p.type === 'adult');
  const children = participants.filter(p => p.type === 'child');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Katılımcı Bilgileri</h2>
        <p className="text-muted-foreground">
          Tüm katılımcıların bilgilerini eksiksiz doldurun. Bu bilgiler sigorta ve güvenlik amaçlı kullanılacaktır.
        </p>
      </div>

      {/* Adult Participants */}
      {adults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Yetişkin Katılımcılar ({adults.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {adults.map((participant, index) => {
              const globalIndex = participants.indexOf(participant);
              return (
                <div key={globalIndex} className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">
                      Yetişkin {index + 1}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {getParticipantDisplayName(participant, globalIndex)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`adult-${index}-firstName`}>
                        Ad <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`adult-${index}-firstName`}
                        value={participant.firstName}
                        onChange={(e) => updateParticipant(globalIndex, 'firstName', e.target.value)}
                        placeholder="Adınız"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor={`adult-${index}-lastName`}>
                        Soyad <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`adult-${index}-lastName`}
                        value={participant.lastName}
                        onChange={(e) => updateParticipant(globalIndex, 'lastName', e.target.value)}
                        placeholder="Soyadınız"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor={`adult-${index}-birthDate`}>
                        Doğum Tarihi
                      </Label>
                      <Input
                        id={`adult-${index}-birthDate`}
                        type="date"
                        value={participant.dateOfBirth}
                        onChange={(e) => updateParticipant(globalIndex, 'dateOfBirth', e.target.value)}
                        min={getMinBirthDate()}
                        max={getMaxBirthDate()}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`adult-${index}-passport`}>
                        TC Kimlik / Pasaport No
                      </Label>
                      <Input
                        id={`adult-${index}-passport`}
                        value={participant.passportNumber}
                        onChange={(e) => updateParticipant(globalIndex, 'passportNumber', e.target.value)}
                        placeholder="TC Kimlik veya Pasaport numarası"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`adult-${index}-requests`}>
                      Özel İstekler
                    </Label>
                    <Textarea
                      id={`adult-${index}-requests`}
                      value={participant.specialRequests}
                      onChange={(e) => updateParticipant(globalIndex, 'specialRequests', e.target.value)}
                      placeholder="Özel diyet, sağlık durumu, erişilebilirlik ihtiyaçları vb."
                      rows={2}
                    />
                  </div>

                  {index < adults.length - 1 && <Separator />}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Child Participants */}
      {children.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5" />
              Çocuk Katılımcılar ({children.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {children.map((participant, index) => {
              const globalIndex = participants.indexOf(participant);
              return (
                <div key={globalIndex} className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">
                      Çocuk {index + 1}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {getParticipantDisplayName(participant, globalIndex)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`child-${index}-firstName`}>
                        Ad <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`child-${index}-firstName`}
                        value={participant.firstName}
                        onChange={(e) => updateParticipant(globalIndex, 'firstName', e.target.value)}
                        placeholder="Çocuğun adı"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor={`child-${index}-lastName`}>
                        Soyad <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`child-${index}-lastName`}
                        value={participant.lastName}
                        onChange={(e) => updateParticipant(globalIndex, 'lastName', e.target.value)}
                        placeholder="Çocuğun soyadı"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor={`child-${index}-birthDate`}>
                        Doğum Tarihi <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`child-${index}-birthDate`}
                        type="date"
                        value={participant.dateOfBirth}
                        onChange={(e) => updateParticipant(globalIndex, 'dateOfBirth', e.target.value)}
                        min={getMinBirthDate()}
                        max={getMaxBirthDate()}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Çocuk için yaş doğrulaması gereklidir
                      </p>
                    </div>

                    <div>
                      <Label htmlFor={`child-${index}-passport`}>
                        TC Kimlik / Pasaport No
                      </Label>
                      <Input
                        id={`child-${index}-passport`}
                        value={participant.passportNumber}
                        onChange={(e) => updateParticipant(globalIndex, 'passportNumber', e.target.value)}
                        placeholder="TC Kimlik veya Pasaport numarası"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`child-${index}-requests`}>
                      Özel İstekler
                    </Label>
                    <Textarea
                      id={`child-${index}-requests`}
                      value={participant.specialRequests}
                      onChange={(e) => updateParticipant(globalIndex, 'specialRequests', e.target.value)}
                      placeholder="Alerjiler, özel ihtiyaçlar, besin kısıtlamaları vb."
                      rows={2}
                    />
                  </div>

                  {index < children.length - 1 && <Separator />}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Important Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Önemli Bilgiler
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
          <p>• Tüm katılımcılar için ad ve soyad bilgisi zorunludur.</p>
          <p>• Çocuklar için doğum tarihi mutlaka girilmelidir (yaş kontrolü için).</p>
          <p>• TC Kimlik veya Pasaport numarası güvenlik amaçlı istenebilir.</p>
          <p>• Özel ihtiyaçlar varsa (diyet, sağlık, erişilebilirlik) mutlaka belirtin.</p>
          <p>• Girilen bilgiler yalnızca tur güvenliği ve sigorta amaçlı kullanılacaktır.</p>
        </CardContent>
      </Card>
    </div>
  );
}
