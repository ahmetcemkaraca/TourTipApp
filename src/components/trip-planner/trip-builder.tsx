'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Users, 
  Plus, 
  Star, 
  Route, 
  Save, 
  Trash2,
  DollarSign,
  Camera,
  Utensils,
  Car,
  Bed,
  Activity,
  ShoppingBag,
  Filter,
  Search,
  Map
} from 'lucide-react';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

interface TripBuilderProps {
  currentTrip: any;
  onTripUpdate: (trip: any) => void;
  isCreating: boolean;
  onCreateToggle: (creating: boolean) => void;
}

interface TripActivity {
  id: string;
  serviceId?: string;
  name: string;
  description: string;
  date: Date;
  startTime: string;
  duration: number;
  location: {
    name: string;
    latitude: number;
    longitude: number;
    address: string;
  };
  cost: number;
  currency: string;
  category: 'tour' | 'restaurant' | 'accommodation' | 'transport' | 'activity' | 'shopping';
  priority: 'low' | 'medium' | 'high';
  bookingRequired: boolean;
  isBooked: boolean;
  notes?: string;
}

const categoryIcons = {
  tour: Star,
  restaurant: Utensils,
  accommodation: Bed,
  transport: Car,
  activity: Activity,
  shopping: ShoppingBag,
};

const categoryColors = {
  tour: 'bg-blue-100 text-blue-800 border-blue-200',
  restaurant: 'bg-orange-100 text-orange-800 border-orange-200',
  accommodation: 'bg-purple-100 text-purple-800 border-purple-200',
  transport: 'bg-green-100 text-green-800 border-green-200',
  activity: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  shopping: 'bg-pink-100 text-pink-800 border-pink-200',
};

export function TripBuilder({ currentTrip, onTripUpdate, isCreating, onCreateToggle }: TripBuilderProps) {
  const [tripData, setTripData] = useState({
    title: '',
    destination: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    travelers: 1,
    budget: 0,
    currency: 'TRY',
    accommodation: '',
    transportation: '',
    notes: '',
    tags: [] as string[],
    isPublic: false,
  });

  const [activities, setActivities] = useState<TripActivity[]>([]);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Calculate trip days
  const tripDays = tripData.startDate && tripData.endDate 
    ? Math.ceil((tripData.endDate.getTime() - tripData.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  // Calculate total cost
  const totalCost = activities.reduce((sum, activity) => sum + activity.cost, 0);

  const handleTripDataChange = (field: string, value: any) => {
    const updatedData = { ...tripData, [field]: value };
    setTripData(updatedData);
    
    // Auto-update end date if start date changes and no end date is set
    if (field === 'startDate' && value && !tripData.endDate) {
      updatedData.endDate = addDays(value, 6); // Default 7-day trip
      setTripData(updatedData);
    }
    
    onTripUpdate({ ...updatedData, activities, totalCost });
  };

  const handleAddActivity = () => {
    setIsAddingActivity(true);
    setSelectedDate(tripData.startDate);
  };

  const handleSaveActivity = (activityData: Partial<TripActivity>) => {
    const newActivity: TripActivity = {
      id: Date.now().toString(),
      name: activityData.name || '',
      description: activityData.description || '',
      date: activityData.date || new Date(),
      startTime: activityData.startTime || '09:00',
      duration: activityData.duration || 2,
      location: activityData.location || {
        name: '',
        latitude: 0,
        longitude: 0,
        address: '',
      },
      cost: activityData.cost || 0,
      currency: activityData.currency || 'TRY',
      category: activityData.category || 'activity',
      priority: activityData.priority || 'medium',
      bookingRequired: activityData.bookingRequired || false,
      isBooked: false,
      notes: activityData.notes,
    };

    setActivities([...activities, newActivity]);
    setIsAddingActivity(false);
    toast.success('Aktivite eklendi!');
  };

  const handleRemoveActivity = (activityId: string) => {
    setActivities(activities.filter(a => a.id !== activityId));
    toast.success('Aktivite kaldırıldı!');
  };

  const handleSaveTrip = async () => {
    if (!tripData.title || !tripData.destination || !tripData.startDate || !tripData.endDate) {
      toast.error('Lütfen gerekli alanları doldurun.');
      return;
    }

    try {
      const tripPlan = {
        ...tripData,
        activities,
        totalCost,
        createdAt: new Date(),
        updatedAt: new Date(),
        id: Date.now().toString(),
      };

      // TODO: Save to Firestore
      console.log('Saving trip plan:', tripPlan);
      
      toast.success('Gezi planı kaydedildi!');
      onCreateToggle(false);
    } catch (error) {
      toast.error('Gezi planı kaydedilirken hata oluştu.');
      console.error('Error saving trip:', error);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || activity.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group activities by date
  const activitiesByDate = filteredActivities.reduce((groups, activity) => {
    const dateKey = format(activity.date, 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
    return groups;
  }, {} as Record<string, TripActivity[]>);

  return (
    <div className="space-y-6">
      {/* Trip Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Gezi Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Gezi Adı *</Label>
              <Input
                id="title"
                placeholder="Örn: İstanbul Kültür Turu"
                value={tripData.title}
                onChange={(e) => handleTripDataChange('title', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="destination">Destinasyon *</Label>
              <Input
                id="destination"
                placeholder="Örn: İstanbul, Türkiye"
                value={tripData.destination}
                onChange={(e) => handleTripDataChange('destination', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Başlangıç Tarihi *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tripData.startDate ? format(tripData.startDate, 'PPP', { locale: tr }) : 'Tarih seçin'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={tripData.startDate}
                    onSelect={(date) => handleTripDataChange('startDate', date)}
                    disabled={(date) => isBefore(date, new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Bitiş Tarihi *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tripData.endDate ? format(tripData.endDate, 'PPP', { locale: tr }) : 'Tarih seçin'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={tripData.endDate}
                    onSelect={(date) => handleTripDataChange('endDate', date)}
                    disabled={(date) => 
                      isBefore(date, new Date()) || 
                      (tripData.startDate && isBefore(date, tripData.startDate))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="travelers">Kişi Sayısı</Label>
              <Input
                id="travelers"
                type="number"
                min="1"
                max="20"
                value={tripData.travelers}
                onChange={(e) => handleTripDataChange('travelers', parseInt(e.target.value) || 1)}
              />
            </div>

            <div>
              <Label htmlFor="budget">Bütçe</Label>
              <div className="flex">
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  value={tripData.budget}
                  onChange={(e) => handleTripDataChange('budget', parseFloat(e.target.value) || 0)}
                  className="rounded-r-none"
                />
                <Select value={tripData.currency} onValueChange={(value) => handleTripDataChange('currency', value)}>
                  <SelectTrigger className="w-20 rounded-l-none border-l-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">TRY</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {tripDays > 0 && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">{tripDays} gün</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{tripData.travelers} kişi</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">{totalCost} {tripData.currency}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activities Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Aktiviteler ({activities.length})
            </CardTitle>
            <Button onClick={handleAddActivity}>
              <Plus className="h-4 w-4 mr-2" />
              Aktivite Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Aktivite ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                <SelectItem value="tour">Turlar</SelectItem>
                <SelectItem value="restaurant">Restoranlar</SelectItem>
                <SelectItem value="accommodation">Konaklama</SelectItem>
                <SelectItem value="transport">Ulaşım</SelectItem>
                <SelectItem value="activity">Aktiviteler</SelectItem>
                <SelectItem value="shopping">Alışveriş</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activities by Date */}
          {Object.keys(activitiesByDate).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(activitiesByDate)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dateKey, dayActivities]) => (
                  <div key={dateKey}>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {format(new Date(dateKey), 'EEEE, d MMMM yyyy', { locale: tr })}
                    </h3>
                    <div className="space-y-3">
                      {dayActivities
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((activity) => (
                          <ActivityCard
                            key={activity.id}
                            activity={activity}
                            onRemove={handleRemoveActivity}
                          />
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Henüz aktivite eklenmemiş</h3>
              <p className="text-muted-foreground mb-4">
                Gezi planınıza aktivite ekleyerek başlayın
              </p>
              <Button onClick={handleAddActivity}>
                <Plus className="h-4 w-4 mr-2" />
                İlk Aktiviteyi Ekle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">
          <Map className="h-4 w-4 mr-2" />
          Haritada Görüntüle
        </Button>
        <Button onClick={handleSaveTrip}>
          <Save className="h-4 w-4 mr-2" />
          Planı Kaydet
        </Button>
      </div>

      {/* Add Activity Modal */}
      {isAddingActivity && (
        <AddActivityModal
          selectedDate={selectedDate}
          tripDates={{ start: tripData.startDate, end: tripData.endDate }}
          onSave={handleSaveActivity}
          onCancel={() => setIsAddingActivity(false)}
        />
      )}
    </div>
  );
}

interface ActivityCardProps {
  activity: TripActivity;
  onRemove: (id: string) => void;
}

function ActivityCard({ activity, onRemove }: ActivityCardProps) {
  const CategoryIcon = categoryIcons[activity.category];
  const categoryClass = categoryColors[activity.category];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-3 flex-1">
            <div className={`p-2 rounded-lg ${categoryClass}`}>
              <CategoryIcon className="h-4 w-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium truncate">{activity.name}</h4>
                <Badge variant={activity.priority === 'high' ? 'destructive' : 
                              activity.priority === 'medium' ? 'default' : 'secondary'}>
                  {activity.priority === 'high' ? 'Yüksek' : 
                   activity.priority === 'medium' ? 'Orta' : 'Düşük'}
                </Badge>
                {activity.bookingRequired && (
                  <Badge variant="outline">Rezervasyon Gerekli</Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {activity.description}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {activity.startTime} ({activity.duration}sa)
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {activity.location.name}
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {activity.cost} {activity.currency}
                </div>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(activity.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface AddActivityModalProps {
  selectedDate: Date | undefined;
  tripDates: { start: Date | undefined; end: Date | undefined };
  onSave: (activity: Partial<TripActivity>) => void;
  onCancel: () => void;
}

function AddActivityModal({ selectedDate, tripDates, onSave, onCancel }: AddActivityModalProps) {
  const [activityData, setActivityData] = useState({
    name: '',
    description: '',
    date: selectedDate || new Date(),
    startTime: '09:00',
    duration: 2,
    location: {
      name: '',
      address: '',
      latitude: 0,
      longitude: 0,
    },
    cost: 0,
    currency: 'TRY',
    category: 'activity' as const,
    priority: 'medium' as const,
    bookingRequired: false,
    notes: '',
  });

  const handleSave = () => {
    if (!activityData.name || !activityData.location.name) {
      toast.error('Lütfen aktivite adı ve konum bilgilerini girin.');
      return;
    }
    onSave(activityData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <CardTitle>Yeni Aktivite Ekle</CardTitle>
        </CardHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="activity-name">Aktivite Adı *</Label>
                <Input
                  id="activity-name"
                  placeholder="Örn: Sultanahmet Camii Ziyareti"
                  value={activityData.name}
                  onChange={(e) => setActivityData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select value={activityData.category} onValueChange={(value: any) => 
                  setActivityData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tour">Tur</SelectItem>
                    <SelectItem value="restaurant">Restoran</SelectItem>
                    <SelectItem value="accommodation">Konaklama</SelectItem>
                    <SelectItem value="transport">Ulaşım</SelectItem>
                    <SelectItem value="activity">Aktivite</SelectItem>
                    <SelectItem value="shopping">Alışveriş</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                placeholder="Aktivite hakkında detaylar..."
                value={activityData.description}
                onChange={(e) => setActivityData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Tarih</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(activityData.date, 'PP', { locale: tr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={activityData.date}
                      onSelect={(date) => date && setActivityData(prev => ({ ...prev, date }))}
                      disabled={(date) => 
                        (tripDates.start && isBefore(date, tripDates.start)) ||
                        (tripDates.end && isAfter(date, tripDates.end))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="start-time">Başlangıç Saati</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={activityData.startTime}
                  onChange={(e) => setActivityData(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="duration">Süre (saat)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={activityData.duration}
                  onChange={(e) => setActivityData(prev => ({ ...prev, duration: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location-name">Konum Adı *</Label>
                <Input
                  id="location-name"
                  placeholder="Örn: Sultanahmet Camii"
                  value={activityData.location.name}
                  onChange={(e) => setActivityData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, name: e.target.value }
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="address">Adres</Label>
                <Input
                  id="address"
                  placeholder="Tam adres"
                  value={activityData.location.address}
                  onChange={(e) => setActivityData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, address: e.target.value }
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cost">Maliyet</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  value={activityData.cost}
                  onChange={(e) => setActivityData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label htmlFor="priority">Öncelik</Label>
                <Select value={activityData.priority} onValueChange={(value: any) => 
                  setActivityData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="medium">Orta</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 mt-6">
                <input
                  id="booking-required"
                  type="checkbox"
                  checked={activityData.bookingRequired}
                  onChange={(e) => setActivityData(prev => ({ ...prev, bookingRequired: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="booking-required" className="text-sm">
                  Rezervasyon Gerekli
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                placeholder="Ek notlar..."
                value={activityData.notes}
                onChange={(e) => setActivityData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </CardContent>
        </ScrollArea>
        
        <div className="p-6 border-t flex justify-end gap-4">
          <Button variant="outline" onClick={onCancel}>
            İptal
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Kaydet
          </Button>
        </div>
      </Card>
    </div>
  );
}
