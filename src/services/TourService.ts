
export interface Tour {
  id: string;
  providerId: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  duration: number; // in hours
  location: string;
  category: string;
  rating: number;
}

const mockTours: Tour[] = [
  {
    id: '1',
    providerId: 'prov1',
    title: 'Historic City Walking Tour',
    description: 'Explore the rich history of our city with a guided walking tour.',
    images: ['https://via.placeholder.com/150'],
    price: 50,
    duration: 2,
    location: 'City Center',
    category: 'Walking Tour',
    rating: 4.5,
  },
  {
    id: '2',
    providerId: 'prov2',
    title: 'Mountain Hiking Adventure',
    description: 'A challenging and rewarding hike through the scenic mountains.',
    images: ['https://via.placeholder.com/150'],
    price: 80,
    duration: 5,
    location: 'Pine Mountains',
    category: 'Hiking',
    rating: 4.8,
  },
  {
    id: '3',
    providerId: 'prov1',
    title: 'Food & Drink Experience',
    description: 'Taste the local cuisine with this guided food tour.',
    images: ['https://via.placeholder.com/150'],
    price: 120,
    duration: 3,
    location: 'Downtown',
    category: 'Food Tour',
    rating: 4.9,
  },
];

export const getTours = (): Promise<Tour[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockTours);
    }, 500); // Simulate network delay
  });
};

export const getTourById = (id: string): Promise<Tour | undefined> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockTours.find(tour => tour.id === id));
    }, 300);
  });
};
