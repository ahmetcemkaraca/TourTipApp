
export interface Booking {
  id: string;
  tourId: string;
  userId: string;
  date: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

let bookings: Booking[] = [
  {
    id: '1',
    tourId: '1',
    userId: '1', // This will be replaced with the actual user id
    date: '2024-08-15',
    status: 'confirmed',
  },
  {
    id: '2',
    tourId: '3',
    userId: '1',
    date: '2024-09-20',
    status: 'pending',
  },
];

export const getBookings = async (userId: string): Promise<Booking[]> => {
  // In a real app, you would fetch this data from a server and filter by userId
  return Promise.resolve(bookings.filter(b => b.userId === userId));
};

export const createBooking = async (userId: string, tourId: string, date: Date): Promise<Booking> => {
  const newBooking: Booking = {
    id: String(bookings.length + 1),
    userId,
    tourId,
    date: date.toISOString().split('T')[0], // format as yyyy-mm-dd
    status: 'confirmed',
  };
  bookings.push(newBooking);
  return Promise.resolve(newBooking);
};
