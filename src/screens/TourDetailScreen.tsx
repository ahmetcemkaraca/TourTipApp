
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { getTourById, Tour } from '../services/TourService';
import { createBooking } from '../services/BookingService';
import { auth } from '../firebase/firebase';

const TourDetailScreen = ({ route, navigation }) => {
  const { tourId } = route.params;
  const [tour, setTour] = useState<Tour | null>(null);
  const user = auth.currentUser;

  useEffect(() => {
    getTourById(tourId).then(setTour);
  }, [tourId]);

  const handleBooking = () => {
    if (user && tour) {
      createBooking(user.uid, tour.id, new Date())
        .then(() => {
          Alert.alert('Booking Confirmed', 'Your tour has been booked successfully.');
          navigation.navigate('Bookings');
        })
        .catch(error => {
          Alert.alert('Booking Error', error.message);
        });
    }
  };

  if (!tour) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{tour.title}</Text>
      <Text style={styles.detail}>Location: {tour.location}</Text>
      <Text style={styles.detail}>Category: {tour.category}</Text>
      <Text style={styles.detail}>Price: ${tour.price}</Text>
      <Text style={styles.detail}>Rating: {tour.rating}</Text>
      <Text style={styles.detail}>{tour.description}</Text>
      <Button title="Confirm Booking" onPress={handleBooking} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detail: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default TourDetailScreen;
