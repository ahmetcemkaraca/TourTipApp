
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Button } from 'react-native';
import { getTours, Tour } from '../services/TourService';
import SearchBar from '../components/SearchBar';

const ToursScreen = ({ navigation }) => {
  const [allTours, setAllTours] = useState<Tour[]>([]);
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getTours().then(tours => {
      setAllTours(tours);
      setFilteredTours(tours);
    });
  }, []);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = allTours.filter(tour => {
      return (
        tour.title.toLowerCase().includes(lowercasedQuery) ||
        tour.location.toLowerCase().includes(lowercasedQuery) ||
        tour.category.toLowerCase().includes(lowercasedQuery)
      );
    });
    setFilteredTours(filtered);
  }, [searchQuery, allTours]);

  const renderItem = ({ item }: { item: Tour }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.title}>{item.title}</Text>
      <Text>{item.location}</Text>
      <Text>${item.price}</Text>
      <Text>Rating: {item.rating}</Text>
      <Button title="Book Now" onPress={() => navigation.navigate('TourDetail', { tourId: item.id })} />
    </View>
  );

  return (
    <View style={styles.container}>
      <SearchBar
        onSearch={setSearchQuery}
        placeholder="Search for tours, locations, or categories"
      />
      <FlatList
        data={filteredTours}
        renderItem={renderItem}
        keyExtractor={item => item.id}
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

export default ToursScreen;
