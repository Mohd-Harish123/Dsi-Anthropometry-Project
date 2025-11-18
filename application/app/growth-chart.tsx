import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth } from '../config/firebase';
import {
  getChildById,
  getPredictionsByChild,
  getUserRole,
  ChildProfile,
  Prediction,
  UserRole,
} from '../services/childService';
import GrowthChart from '../components/GrowthChart';

export default function GrowthChartScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const childId = params.childId as string;

  const [child, setChild] = useState<ChildProfile | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState<'height' | 'head' | 'wrist'>('height');

  useEffect(() => {
    loadData();
  }, [childId]);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please login first');
        router.push('/login');
        return;
      }

      const role = await getUserRole(user.uid);
      const childData = await getChildById(childId, user.uid, role);
      
      if (!childData) {
        Alert.alert('Error', 'Child not found');
        router.back();
        return;
      }
      
      setChild(childData);

      const predictionsData = await getPredictionsByChild(childId, user.uid, role);
      setPredictions(predictionsData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      Alert.alert('Error', error.message || 'Failed to load growth chart data');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0b6cff" />
        <Text style={styles.loadingText}>Loading growth chart...</Text>
      </View>
    );
  }

  if (!child) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Child data not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{child.name}'s Growth Chart</Text>
        <Text style={styles.headerSubtitle}>
          {child.gender} • {calculateAge(child.dateOfBirth)}
        </Text>
      </View>

      {/* Chart Type Selector */}
      <View style={styles.selectorContainer}>
        <TouchableOpacity
          style={[styles.selectorButton, selectedChart === 'height' && styles.selectorButtonActive]}
          onPress={() => setSelectedChart('height')}
        >
          <Text style={[styles.selectorText, selectedChart === 'height' && styles.selectorTextActive]}>
            Height
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.selectorButton, selectedChart === 'head' && styles.selectorButtonActive]}
          onPress={() => setSelectedChart('head')}
        >
          <Text style={[styles.selectorText, selectedChart === 'head' && styles.selectorTextActive]}>
            Head Circ.
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.selectorButton, selectedChart === 'wrist' && styles.selectorButtonActive]}
          onPress={() => setSelectedChart('wrist')}
        >
          <Text style={[styles.selectorText, selectedChart === 'wrist' && styles.selectorTextActive]}>
            Wrist Circ.
          </Text>
        </TouchableOpacity>
      </View>

      {/* Growth Chart */}
      {predictions.length > 0 ? (
        <GrowthChart
          predictions={predictions}
          childGender={child.gender}
          childDateOfBirth={child.dateOfBirth}
          measurementType={selectedChart}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Measurements Yet</Text>
          <Text style={styles.emptyText}>
            Add measurements to see growth trends and compare with WHO standards.
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push({
              pathname: '/home',
              params: { childId, childName: child.name },
            })}
          >
            <Text style={styles.addButtonText}>Add First Measurement</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function calculateAge(dateOfBirth: string): string {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const years = today.getFullYear() - birthDate.getFullYear();
  const months = today.getMonth() - birthDate.getMonth();
  
  if (years < 1) {
    return `${months + (years * 12)} months old`;
  } else if (years === 1) {
    return '1 year old';
  } else {
    return `${years} years old`;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6fb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
  },
  header: {
    backgroundColor: '#0b6cff',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 0,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectorButtonActive: {
    backgroundColor: '#0b6cff',
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectorTextActive: {
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  addButton: {
    backgroundColor: '#0b6cff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
