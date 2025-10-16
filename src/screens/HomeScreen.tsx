
import React from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import { signOut } from "firebase/auth";
import { auth } from '../firebase/firebase';

const HomeScreen = ({ navigation }) => {

  const handleLogout = () => {
    signOut(auth).then(() => {
      // Sign-out successful.
      navigation.navigate('Login');
    }).catch((error) => {
      // An error happened.
      Alert.alert("Logout Error", error.message);
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {auth.currentUser?.email}</Text>
      <Text style={styles.subtitle}>What would you like to do today?</Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Logout"
          onPress={handleLogout}
          color="#f44336"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
  },
  buttonContainer: {
    marginTop: 20,
    width: '100%',
  },
});

export default HomeScreen;
