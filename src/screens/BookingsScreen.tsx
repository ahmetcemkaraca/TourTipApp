
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { getBookings, Booking } from '../services/BookingService';
import { auth } from '../firebase/firebase';

const BookingsScreen = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      getBookings(user.uid)
        .then(setBookings)
        .catch(error => Alert.alert('Error fetching bookings', error.message));
    }
  }, [user]);

  const renderItem = ({ item }: { item: Booking }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.title}>Tour ID: {item.tourId}</Text>
      <Text>Date: {item.date}</Text>
      <Text>Status: {item.status}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text>You have no bookings.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  itemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BookingsScreen;
