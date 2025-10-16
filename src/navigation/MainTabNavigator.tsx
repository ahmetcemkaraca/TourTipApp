
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ToursScreen from '../screens/ToursScreen';
import BookingsScreen from '../screens/BookingsScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tours" component={ToursScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
