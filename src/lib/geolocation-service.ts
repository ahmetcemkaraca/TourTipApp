// Firestore geolocation service using GeoFirestore for TourTrip.app
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore';
import { GeoFirestore } from 'geofirestore';
import { geohashForLocation, distanceBetween } from 'geofire-common';
import { db } from './firebase';
import { 
  Coordinates, 
  Location, 
  POI, 
  TourLocation, 
  LocationSearchParams, 
  GeofireDocument 
} from '@/types/location';

class GeolocationService {
  private geoFirestore: GeoFirestore;

  constructor() {
    this.geoFirestore = new GeoFirestore(db);
  }

  /**
   * Add a new location with geohash indexing
   */
  async addLocation(location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const locationData = {
        ...location,
        coordinates: location.coordinates,
        geohash: geohashForLocation([location.coordinates.latitude, location.coordinates.longitude]),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const geoCollection = this.geoFirestore.collection('locations');
      const docRef = await geoCollection.add(locationData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding location:', error);
      throw error;
    }
  }

  /**
   * Update an existing location
   */
  async updateLocation(
    locationId: string, 
    updates: Partial<Omit<Location, 'id' | 'createdAt'>>
  ): Promise<void> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      // Update geohash if coordinates changed
      if (updates.coordinates) {
        updateData.geohash = geohashForLocation([
          updates.coordinates.latitude, 
          updates.coordinates.longitude
        ]);
      }

      const geoCollection = this.geoFirestore.collection('locations');
      await geoCollection.doc(locationId).update(updateData);
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  /**
   * Delete a location
   */
  async deleteLocation(locationId: string): Promise<void> {
    try {
      const geoCollection = this.geoFirestore.collection('locations');
      await geoCollection.doc(locationId).delete();
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }

  /**
   * Search locations within radius
   */
  async searchLocationsInRadius(
    center: Coordinates, 
    radiusKm: number, 
    params?: LocationSearchParams
  ): Promise<Location[]> {
    try {
      const geoCollection = this.geoFirestore.collection('locations');
      
      const geoQuery = geoCollection.near({
        center: [center.latitude, center.longitude],
        radius: radiusKm
      });

      const snapshot = await geoQuery.get();
      
      let locations: Location[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Location, 'id'>
      }));

      // Apply additional filters
      if (params?.country) {
        locations = locations.filter(loc => loc.country === params.country);
      }

      // Apply limit
      if (params?.limit) {
        locations = locations.slice(0, params.limit);
      }

      return locations;
    } catch (error) {
      console.error('Error searching locations:', error);
      throw error;
    }
  }

  /**
   * Add a new POI with geohash indexing
   */
  async addPOI(poi: Omit<POI, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const poiData = {
        ...poi,
        coordinates: poi.coordinates,
        geohash: geohashForLocation([poi.coordinates.latitude, poi.coordinates.longitude]),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const geoCollection = this.geoFirestore.collection('pois');
      const docRef = await geoCollection.add(poiData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding POI:', error);
      throw error;
    }
  }

  /**
   * Update an existing POI
   */
  async updatePOI(
    poiId: string, 
    updates: Partial<Omit<POI, 'id' | 'createdAt'>>
  ): Promise<void> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      // Update geohash if coordinates changed
      if (updates.coordinates) {
        updateData.geohash = geohashForLocation([
          updates.coordinates.latitude, 
          updates.coordinates.longitude
        ]);
      }

      const geoCollection = this.geoFirestore.collection('pois');
      await geoCollection.doc(poiId).update(updateData);
    } catch (error) {
      console.error('Error updating POI:', error);
      throw error;
    }
  }

  /**
   * Search POIs within radius
   */
  async searchPOIsInRadius(
    center: Coordinates, 
    radiusKm: number, 
    type?: POI['type']
  ): Promise<POI[]> {
    try {
      const geoCollection = this.geoFirestore.collection('pois');
      
      const geoQuery = geoCollection.near({
        center: [center.latitude, center.longitude],
        radius: radiusKm
      });

      const snapshot = await geoQuery.get();
      
      let pois: POI[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<POI, 'id'>
      }));

      // Filter by type if specified
      if (type) {
        pois = pois.filter(poi => poi.type === type);
      }

      return pois;
    } catch (error) {
      console.error('Error searching POIs:', error);
      throw error;
    }
  }

  /**
   * Add tour location to itinerary
   */
  async addTourLocation(tourLocation: Omit<TourLocation, 'id'>): Promise<string> {
    try {
      const tourLocationRef = await addDoc(collection(db, 'tourLocations'), {
        ...tourLocation,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return tourLocationRef.id;
    } catch (error) {
      console.error('Error adding tour location:', error);
      throw error;
    }
  }

  /**
   * Get tour locations for a specific tour
   */
  async getTourLocations(tourId: string): Promise<TourLocation[]> {
    try {
      const q = query(
        collection(db, 'tourLocations'),
        where('tourId', '==', tourId),
        orderBy('order')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<TourLocation, 'id'>
      }));
    } catch (error) {
      console.error('Error getting tour locations:', error);
      throw error;
    }
  }

  /**
   * Update tour location order
   */
  async updateTourLocationOrder(tourLocationId: string, newOrder: number): Promise<void> {
    try {
      await updateDoc(doc(db, 'tourLocations', tourLocationId), {
        order: newOrder,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating tour location order:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two coordinates
   */
  calculateDistance(point1: Coordinates, point2: Coordinates): number {
    return distanceBetween(
      [point1.latitude, point1.longitude],
      [point2.latitude, point2.longitude]
    );
  }

  /**
   * Generate geohash for coordinates
   */
  generateGeohash(coordinates: Coordinates, precision: number = 10): string {
    return geohashForLocation([coordinates.latitude, coordinates.longitude], precision);
  }

  /**
   * Find nearby tours based on location
   */
  async findNearbyTours(
    center: Coordinates, 
    radiusKm: number, 
    options?: {
      limit?: number;
      priceRange?: { min: number; max: number };
      difficulty?: string;
      duration?: { min: number; max: number };
    }
  ): Promise<any[]> {
    try {
      const geoCollection = this.geoFirestore.collection('tours');
      
      const geoQuery = geoCollection.near({
        center: [center.latitude, center.longitude],
        radius: radiusKm
      });

      const snapshot = await geoQuery.get();
      
      let tours = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        distance: this.calculateDistance(
          center,
          { latitude: doc.data().coordinates.latitude, longitude: doc.data().coordinates.longitude }
        )
      }));

      // Apply filters
      if (options?.priceRange) {
        tours = tours.filter(tour => 
          tour.price >= options.priceRange!.min && 
          tour.price <= options.priceRange!.max
        );
      }

      if (options?.difficulty) {
        tours = tours.filter(tour => tour.difficulty === options.difficulty);
      }

      if (options?.duration) {
        tours = tours.filter(tour => 
          tour.duration >= options.duration!.min && 
          tour.duration <= options.duration!.max
        );
      }

      // Sort by distance
      tours.sort((a, b) => a.distance - b.distance);

      // Apply limit
      if (options?.limit) {
        tours = tours.slice(0, options.limit);
      }

      return tours;
    } catch (error) {
      console.error('Error finding nearby tours:', error);
      throw error;
    }
  }

  /**
   * Create geo index for a collection
   */
  async createGeoIndex(collectionName: string): Promise<void> {
    try {
      // This would typically be done through Firebase console or CLI
      // But we can document the required indexes here
      console.log(`Create composite index for ${collectionName}:`);
      console.log('Fields: geohash (Ascending), [other fields as needed]');
      
      // For reference, the index creation command would be:
      // firebase firestore:index:create --collection-group=collectionName
    } catch (error) {
      console.error('Error creating geo index:', error);
      throw error;
    }
  }

  /**
   * Batch update locations with geohashes (for migration)
   */
  async migrateLocationsToGeoFirestore(): Promise<void> {
    try {
      const locationsRef = collection(db, 'locations');
      const snapshot = await getDocs(locationsRef);

      const batch = db.batch ? db.batch() : null;
      if (!batch) {
        throw new Error('Firestore batch not available');
      }

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.coordinates && !data.geohash) {
          const geohash = geohashForLocation([
            data.coordinates.latitude,
            data.coordinates.longitude
          ]);
          
          batch.update(docSnap.ref, { geohash });
        }
      });

      await batch.commit();
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Error migrating locations:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const geolocationService = new GeolocationService();
