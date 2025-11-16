import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function HomeScreen() {
  const { name, role } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      {/* Gradient/Header Section */}
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1506765515384-028b60a970df?auto=format&fit=crop&q=60&w=800"
        }}
        style={styles.header}
        imageStyle={{ opacity: 0.35 }}
      >
        <Text style={styles.headerText}>Welcome 👋</Text>
        <Text style={styles.subHeaderText}>{name}</Text>
      </ImageBackground>

      {/* Card Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{name}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{role}</Text>
        </View>

        {/* Button */}
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Perform Test</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6fb",
  },

  header: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
    backgroundColor: "#0b6cff",
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: "hidden",
  },

  headerText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 6,
  },

  subHeaderText: {
    fontSize: 18,
    color: "#eef3ff",
    fontWeight: "500",
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -40,
    padding: 20,
    borderRadius: 18,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  label: {
    fontSize: 16,
    color: "#555",
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },

  button: {
    marginTop: 25,
    backgroundColor: "#0b6cff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
