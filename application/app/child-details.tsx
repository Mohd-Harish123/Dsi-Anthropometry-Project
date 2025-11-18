import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
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

export default function ChildDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const childId = params.childId as string;

  const [child, setChild] = useState<ChildProfile | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('parent');

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
      setUserRole(role);

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
      Alert.alert('Error', error.message || 'Failed to load child details');
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddPrediction = () => {
    router.push({
      pathname: '/home',
      params: { childId, childName: child?.name },
    });
  };

  const calculateAge = (dateOfBirth: string): string => {
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
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0b6cff" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  if (!child) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Child not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Child Profile */}
      <View style={styles.profileSection}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarTextLarge}>
            {child.name.substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.childName}>{child.name}</Text>
        <Text style={styles.childAge}>{calculateAge(child.dateOfBirth)}</Text>
        <Text style={styles.childGender}>
          {child.gender.charAt(0).toUpperCase() + child.gender.slice(1)}
        </Text>

        {child.guardianName && (
          <View style={styles.guardianInfo}>
            <Text style={styles.guardianLabel}>Guardian:</Text>
            <Text style={styles.guardianText}>{child.guardianName}</Text>
            {child.guardianContact && (
              <Text style={styles.guardianContact}>{child.guardianContact}</Text>
            )}
          </View>
        )}

        {child.assignedDoctorName && (
          <View style={styles.assignedDoctorInfo}>
            <Text style={styles.assignedDoctorLabel}>Assigned Doctor:</Text>
            <Text style={styles.assignedDoctorText}>{child.assignedDoctorName}</Text>
            <Text style={styles.assignedByText}>
              Assigned by {child.createdByRole === 'healthcare_worker' ? 'Healthcare Worker' : 'other'}
            </Text>
          </View>
        )}
      </View>

      {/* Add Prediction Button */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.addPredictionButton} onPress={handleAddPrediction}>
          <Text style={styles.addPredictionButtonText}>+ New Measurement</Text>
        </TouchableOpacity>
        
        {predictions.length > 0 && (
          <>
            <TouchableOpacity 
              style={styles.growthChartButton} 
              onPress={() => router.push({
                pathname: '/growth-chart' as any,
                params: { childId }
              })}
            >
              <Text style={styles.growthChartButtonText}>📊 View Growth Chart</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.viewAllButton} 
              onPress={() => router.push({
                pathname: '/previous-predictions' as any,
                params: { childId }
              })}
            >
              <Text style={styles.viewAllButtonText}>View All Predictions</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Predictions History */}
      <View style={styles.predictionsSection}>
        <Text style={styles.sectionTitle}>
          Measurement History ({predictions.length})
        </Text>

        {predictions.length === 0 ? (
          <View style={styles.emptyPredictions}>
            <Text style={styles.emptyText}>No measurements yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the button above to take the first measurement
            </Text>
          </View>
        ) : (
          predictions.map((prediction, index) => (
            <View key={prediction.id || index} style={styles.predictionCard}>
              <View style={styles.predictionHeader}>
                <Text style={styles.predictionDate}>
                  {formatDate(prediction.timestamp.toDate())}
                </Text>
                {prediction.wrist_fallback_used && (
                  <Text style={styles.fallbackBadge}>Estimated</Text>
                )}
              </View>

              <View style={styles.measurementGrid}>
                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>Height</Text>
                  <Text style={styles.measurementValue}>
                    {prediction.height_cm.toFixed(1)} cm
                  </Text>
                </View>

                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>Head Circ.</Text>
                  <Text style={styles.measurementValue}>
                    {prediction.head_circumference_cm.toFixed(1)} cm
                  </Text>
                </View>

                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>Wrist Circ.</Text>
                  <Text style={styles.measurementValue}>
                    {prediction.wrist_circumference_cm
                      ? `${prediction.wrist_circumference_cm.toFixed(1)} cm`
                      : 'N/A'}
                  </Text>
                </View>
              </View>

              {prediction.notes && (
                <Text style={styles.predictionNotes}>{prediction.notes}</Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleDateString('en-US', options);
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
    color: '#666',
  },

  profileSection: {
    backgroundColor: '#0b6cff',
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },

  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  avatarTextLarge: {
    color: '#0b6cff',
    fontSize: 36,
    fontWeight: '700',
  },

  childName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },

  childAge: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },

  childGender: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },

  guardianInfo: {
    marginTop: 20,
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
    width: '80%',
  },

  guardianLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
    marginBottom: 4,
  },

  guardianText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },

  guardianContact: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },

  assignedDoctorInfo: {
    marginTop: 20,
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
    width: '80%',
  },

  assignedDoctorLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
    marginBottom: 4,
  },

  assignedDoctorText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },

  assignedByText: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.7,
    marginTop: 4,
    fontStyle: 'italic',
  },

  actionSection: {
    padding: 16,
  },

  addPredictionButton: {
    backgroundColor: '#0b6cff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },

  addPredictionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  growthChartButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },

  growthChartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  viewAllButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0b6cff',
  },

  viewAllButtonText: {
    color: '#0b6cff',
    fontSize: 16,
    fontWeight: '600',
  },

  predictionsSection: {
    padding: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },

  emptyPredictions: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },

  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  predictionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  predictionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },

  fallbackBadge: {
    fontSize: 12,
    color: '#ff9800',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  measurementGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  measurementItem: {
    flex: 1,
    alignItems: 'center',
  },

  measurementLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },

  measurementValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b6cff',
  },

  predictionNotes: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
