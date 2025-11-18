import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { auth } from '../config/firebase';
import {
  getPredictionsByChild,
  getChildById,
  getUserRole,
  Prediction,
  ChildProfile,
  UserRole,
} from '../services/childService';

export default function PreviousPredictionsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('parent');

  const childId = params.childId as string;

  useEffect(() => {
    loadData();
  }, [childId]);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please login first');
        router.push('/LoginRegister');
        return;
      }

      const role = await getUserRole(user.uid);
      setUserRole(role);

      // Load child details
      const childData = await getChildById(childId, user.uid, role);
      if (!childData) {
        Alert.alert('Error', 'Child not found');
        router.back();
        return;
      }
      setChild(childData);

      // Load predictions for this child
      const predictionsData = await getPredictionsByChild(childId, user.uid, role);
      console.log(`Loaded ${predictionsData.length} predictions for child:`, childId);
      setPredictions(predictionsData);
    } catch (error) {
      console.error('Error loading predictions:', error);
      Alert.alert('Error', 'Failed to load predictions. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDate = (timestamp: any) => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  const formatTime = (timestamp: any) => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Unknown time';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0b6cff" />
        <Text style={styles.loadingText}>Loading predictions...</Text>
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
        <Text style={styles.headerTitle}>Previous Predictions</Text>
        <View style={styles.backButton} />
      </View>

      {/* Child Info */}
      {child && (
        <View style={styles.childInfoCard}>
          <View style={styles.childAvatar}>
            <Text style={styles.childAvatarText}>
              {child.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{child.name}</Text>
            <Text style={styles.childDetails}>
              {child.gender} • DOB: {child.dateOfBirth}
            </Text>
          </View>
        </View>
      )}

      {/* Predictions List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {predictions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No predictions yet</Text>
            <Text style={styles.emptySubtext}>
              Take a measurement to see it here
            </Text>
            <TouchableOpacity
              style={styles.takeMeasurementButton}
              onPress={() => router.push({
                pathname: '/home',
                params: { childId, childName: child?.name }
              })}
            >
              <Text style={styles.takeMeasurementButtonText}>
                Take New Measurement
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.countText}>
              {predictions.length} prediction{predictions.length !== 1 ? 's' : ''} found
            </Text>
            {predictions.map((prediction, index) => (
              <View key={prediction.id || index} style={styles.predictionCard}>
                {/* Date and Time */}
                <View style={styles.dateTimeContainer}>
                  <View style={styles.dateTimeRow}>
                    <Text style={styles.dateIcon}>📅</Text>
                    <Text style={styles.dateText}>
                      {formatDate(prediction.timestamp)}
                    </Text>
                  </View>
                  <View style={styles.dateTimeRow}>
                    <Text style={styles.timeIcon}>🕐</Text>
                    <Text style={styles.timeText}>
                      {formatTime(prediction.timestamp)}
                    </Text>
                  </View>
                </View>

                {/* Measurements */}
                <View style={styles.measurementsContainer}>
                  <View style={styles.measurementRow}>
                    <Text style={styles.measurementLabel}>Height:</Text>
                    <Text style={styles.measurementValue}>
                      {prediction.height_cm.toFixed(1)} cm
                    </Text>
                  </View>

                  <View style={styles.measurementRow}>
                    <Text style={styles.measurementLabel}>Head Circumference:</Text>
                    <Text style={styles.measurementValue}>
                      {prediction.head_circumference_cm.toFixed(1)} cm
                    </Text>
                  </View>

                  <View style={styles.measurementRow}>
                    <Text style={styles.measurementLabel}>Wrist Circumference:</Text>
                    <Text style={styles.measurementValue}>
                      {prediction.wrist_circumference_cm
                        ? `${prediction.wrist_circumference_cm.toFixed(1)} cm`
                        : 'N/A'}
                    </Text>
                  </View>

                  {prediction.wrist_fallback_used && (
                    <View style={styles.fallbackBadge}>
                      <Text style={styles.fallbackBadgeText}>
                        ⚠ Wrist estimated using fallback
                      </Text>
                    </View>
                  )}

                  <View style={styles.measurementRow}>
                    <Text style={styles.measurementLabel}>Scale Factor:</Text>
                    <Text style={styles.measurementValue}>
                      {prediction.pixel_per_cm.toFixed(2)} px/cm
                    </Text>
                  </View>
                </View>

                {/* Additional Info */}
                {prediction.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{prediction.notes}</Text>
                  </View>
                )}

                {/* Recorded By */}
                <View style={styles.footerContainer}>
                  <Text style={styles.footerText}>
                    Recorded by: {prediction.createdByRole === 'doctor' ? 'Doctor' : 'Parent'}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {predictions.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push({
            pathname: '/home',
            params: { childId, childName: child?.name }
          })}
        >
          <Text style={styles.fabText}>+ New</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0b6cff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  childInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  childAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0b6cff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  childAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  childDetails: {
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  takeMeasurementButton: {
    backgroundColor: '#0b6cff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  takeMeasurementButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  predictionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  timeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  measurementsContainer: {
    marginBottom: 12,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  measurementLabel: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
  },
  measurementValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '700',
  },
  fallbackBadge: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
  },
  fallbackBadgeText: {
    fontSize: 13,
    color: '#856404',
    fontWeight: '500',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#0b6cff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
