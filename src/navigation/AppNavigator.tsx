
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import TourDetailScreen from '../screens/TourDetailScreen';
import MainTabNavigator from './MainTabNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="TourDetail" component={TourDetailScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
