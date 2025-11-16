import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function HomeScreen() {
  const { name, role } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>

      <Text style={styles.text}>Name: {name}</Text>
      <Text style={styles.text}>Role: {role}</Text>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Perform Test</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  text: { fontSize: 20, marginVertical: 6 },
  button: {
    marginTop: 30,
    backgroundColor: '#0b6cff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8
  },
  buttonText: { color: '#fff', fontSize: 18 }
});
