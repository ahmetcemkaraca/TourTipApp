'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Star, 
  Edit, 
  Trash2, 
  Share2, 
  Copy,
  Eye,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

interface SavedTripsProps {
  onTripSelect: (trip: any) => void;
}

interface TripPlan {
  id: string;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  travelers: number;
  budget: number;
  currency: string;
  activities: any[];
  totalCost: number;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string;
  rating?: number;
  views?: number;
  likes?: number;
}

// Mock data - TODO: Replace with Firestore data
// TODO: Load saved trips from Firestore
const trips: TripPlan[] = [
  {
    id: '1',
    title: 'İstanbul Kültür Turu',
    destination: 'İstanbul, Türkiye',
    startDate: new Date('2024-06-15'),
    endDate: new Date('2024-06-18'),
    travelers: 2,
    budget: 5000,
    currency: 'TRY',
    activities: [],
    totalCost: 4850,
    isPublic: true,
    tags: ['kültür', 'tarih', 'müze'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    thumbnail: '/images/istanbul-tour.jpg',
    rating: 4.8,
    views: 234,
    likes: 45,
  },
  {
    id: '2',
    title: 'Kapadokya Balon Turu',
    destination: 'Kapadokya, Türkiye',
    startDate: new Date('2024-07-10'),
    endDate: new Date('2024-07-13'),
    travelers: 4,
    budget: 8000,
    currency: 'TRY',
    activities: [],
    totalCost: 7650,
    isPublic: false,
    tags: ['macera', 'doğa', 'balon'],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-05'),
    thumbnail: '/images/cappadocia-tour.jpg',
    rating: 4.9,
    views: 156,
    likes: 32,
  },
  {
    id: '3',
    title: 'Antalya Deniz Tatili',
    destination: 'Antalya, Türkiye',
    startDate: new Date('2024-08-05'),
    endDate: new Date('2024-08-10'),
    travelers: 6,
    budget: 12000,
    currency: 'TRY',
    activities: [],
    totalCost: 11200,
    isPublic: true,
    tags: ['deniz', 'plaj', 'aile'],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-18'),
    thumbnail: '/images/antalya-tour.jpg',
    rating: 4.6,
    views: 189,
    likes: 28,
  },
];

export function SavedTrips({ onTripSelect }: SavedTripsProps) {
  const [trips, setTrips] = useState<TripPlan[]>(mockTrips);
  const [filteredTrips, setFilteredTrips] = useState<TripPlan[]>(mockTrips);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'cost' | 'rating'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<'all' | 'public' | 'private'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Get all unique tags
  const allTags = Array.from(new Set(trips.flatMap(trip => trip.tags)));

  useEffect(() => {
    let filtered = [...trips];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(trip =>
        trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply visibility filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(trip =>
        filterBy === 'public' ? trip.isPublic : !trip.isPublic
      );
    }

    // Apply tag filter
    if (selectedTag !== 'all') {
      filtered = filtered.filter(trip => trip.tags.includes(selectedTag));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'cost':
          comparison = a.totalCost - b.totalCost;
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTrips(filtered);
  }, [trips, searchQuery, sortBy, sortOrder, filterBy, selectedTag]);

  const handleDeleteTrip = async (tripId: string) => {
    if (window.confirm('Bu gezi planını silmek istediğinizden emin misiniz?')) {
      try {
        // TODO: Delete from Firestore
        setTrips(trips.filter(trip => trip.id !== tripId));
        toast.success('Gezi planı silindi!');
      } catch (error) {
        toast.error('Gezi planı silinirken hata oluştu.');
        console.error('Error deleting trip:', error);
      }
    }
  };

  const handleShareTrip = async (trip: TripPlan) => {
    try {
      const url = `${window.location.origin}/trips/${trip.id}`;
      await navigator.clipboard.writeText(url);
      toast.success('Plan linki kopyalandı!');
    } catch (error) {
      toast.error('Link kopyalanırken hata oluştu.');
    }
  };

  const handleDuplicateTrip = async (trip: TripPlan) => {
    try {
      const duplicatedTrip = {
        ...trip,
        id: Date.now().toString(),
        title: `${trip.title} (Kopya)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: false,
      };
      
      setTrips([duplicatedTrip, ...trips]);
      toast.success('Gezi planı kopyalandı!');
    } catch (error) {
      toast.error('Gezi planı kopyalanırken hata oluştu.');
      console.error('Error duplicating trip:', error);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Gezi Planlarım ({filteredTrips.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Plan ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Tarihe Göre</SelectItem>
                  <SelectItem value="name">İsme Göre</SelectItem>
                  <SelectItem value="cost">Maliyete Göre</SelectItem>
                  <SelectItem value="rating">Değerlendirmeye Göre</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={toggleSortOrder}>
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>

            {/* Filter by visibility */}
            <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Planlar</SelectItem>
                <SelectItem value="public">Herkese Açık</SelectItem>
                <SelectItem value="private">Özel</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter by tag */}
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger>
                <SelectValue placeholder="Etiket" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Etiketler</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trip Cards */}
      {filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onSelect={() => onTripSelect(trip)}
              onDelete={handleDeleteTrip}
              onShare={handleShareTrip}
              onDuplicate={handleDuplicateTrip}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Plan bulunamadı</h3>
            <p className="text-muted-foreground mb-4">
              Arama kriterlerinize uygun gezi planı bulunamadı.
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setFilterBy('all');
              setSelectedTag('all');
            }}>
              Filtreleri Temizle
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface TripCardProps {
  trip: TripPlan;
  onSelect: () => void;
  onDelete: (tripId: string) => void;
  onShare: (trip: TripPlan) => void;
  onDuplicate: (trip: TripPlan) => void;
}

function TripCard({ trip, onSelect, onDelete, onShare, onDuplicate }: TripCardProps) {
  const tripDuration = Math.ceil(
    (trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
      <div onClick={onSelect}>
        {/* Trip Image/Thumbnail */}
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg overflow-hidden">
          {trip.thumbnail ? (
            <img 
              src={trip.thumbnail} 
              alt={trip.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="h-12 w-12 text-white/80" />
            </div>
          )}
          
          {/* Overlay with quick stats */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-4 left-4 text-white">
              <div className="flex items-center gap-4 text-sm">
                {trip.views && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {trip.views}
                  </div>
                )}
                {trip.likes && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {trip.likes}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Public/Private Badge */}
          <div className="absolute top-4 right-4">
            <Badge variant={trip.isPublic ? 'default' : 'secondary'}>
              {trip.isPublic ? 'Herkese Açık' : 'Özel'}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Trip Title and Destination */}
          <div className="mb-3">
            <h3 className="font-semibold text-lg line-clamp-1 mb-1">
              {trip.title}
            </h3>
            <p className="text-muted-foreground text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {trip.destination}
            </p>
          </div>

          {/* Trip Details */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{tripDuration} gün</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{trip.travelers} kişi</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>{trip.totalCost} {trip.currency}</span>
            </div>
            {trip.rating && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span>{trip.rating}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {trip.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {trip.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {trip.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{trip.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Trip Dates */}
          <div className="text-xs text-muted-foreground mb-4">
            {format(trip.startDate, 'dd MMM', { locale: tr })} - {format(trip.endDate, 'dd MMM yyyy', { locale: tr })}
          </div>

          {/* Last Updated */}
          <div className="text-xs text-muted-foreground">
            Son güncelleme: {formatDistanceToNow(trip.updatedAt, { locale: tr, addSuffix: true })}
          </div>
        </CardContent>
      </div>

      {/* Action Buttons */}
      <div className="p-4 pt-0">
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={onSelect}>
            <Edit className="h-3 w-3 mr-1" />
            Düzenle
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onShare(trip);
            }}
          >
            <Share2 className="h-3 w-3" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(trip);
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(trip.id);
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
