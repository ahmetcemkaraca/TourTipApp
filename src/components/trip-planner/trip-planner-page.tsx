'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, MapPin, Clock, Users, Plus, Star, Route, Save, Share2, Download, Filter } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { TripBuilder } from './trip-builder';
import { SavedTrips } from './saved-trips';
import { RouteOptimizer } from './route-optimizer';
import { BudgetCalculator } from './budget-calculator';
import { Breadcrumb } from '@/components/layout/breadcrumb';

interface TripPlan {
  id: string;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  travelers: number;
  budget: number;
  currency: string;
  activities: TripActivity[];
  accommodation: string;
  transportation: string;
  totalCost: number;
  optimizedRoute?: RoutePoint[];
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface TripActivity {
  id: string;
  serviceId?: string;
  name: string;
  description: string;
  date: Date;
  startTime: string;
  duration: number; // in hours
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

interface RoutePoint {
  id: string;
  activityId: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  estimatedDuration: number;
  travelTime: number;
  order: number;
}

export function TripPlannerPage() {
  const [activeTab, setActiveTab] = useState('create');
  const [currentTrip, setCurrentTrip] = useState<Partial<TripPlan> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={[
            { label: 'Ana Sayfa', href: '/' },
            { label: 'Gezi Planlayıcı', current: true },
          ]} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Gezi Planlayıcı</h1>
              <p className="text-muted-foreground">
                Kişiselleştirilmiş gezi planlarınızı oluşturun ve rotalarınızı optimize edin
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Planları Keşfet
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Plan Oluştur
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <QuickStatsCard
            title="Kaydedilen Planlar"
            value="12"
            icon={Save}
            color="blue"
          />
          <QuickStatsCard
            title="Tamamlanan Geziler"
            value="5"
            icon={Star}
            color="green"
          />
          <QuickStatsCard
            title="Toplam Mesafe"
            value="2,450 km"
            icon={Route}
            color="purple"
          />
          <QuickStatsCard
            title="Tasarruf Edilen"
            value="₺3,200"
            icon={MapPin}
            color="orange"
          />
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Plan Oluştur</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Kaydedilenler</span>
            </TabsTrigger>
            <TabsTrigger value="optimizer" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              <span className="hidden sm:inline">Rota Optimizasyonu</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <Badge className="h-4 w-4" />
              <span className="hidden sm:inline">Bütçe Hesaplayıcı</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <TripBuilder 
              currentTrip={currentTrip}
              onTripUpdate={setCurrentTrip}
              isCreating={isCreating}
              onCreateToggle={setIsCreating}
            />
          </TabsContent>

          <TabsContent value="saved">
            <SavedTrips onTripSelect={setCurrentTrip} />
          </TabsContent>

          <TabsContent value="optimizer">
            <RouteOptimizer currentTrip={currentTrip} />
          </TabsContent>

          <TabsContent value="budget">
            <BudgetCalculator currentTrip={currentTrip} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface QuickStatsCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function QuickStatsCard({ title, value, icon: Icon, color }: QuickStatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    green: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    orange: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
