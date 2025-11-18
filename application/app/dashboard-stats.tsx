/**
 * Role-Based Dashboard Screen
 * Shows different statistics and features based on user role (Doctor or Parent)
 */

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
import { useRouter } from 'expo-router';
import { auth } from '../config/firebase';
import {
  getChildrenByUser,
  getUserRole,
  getAllPredictionsByUser,
  UserRole,
  ChildProfile,
  Prediction,
} from '../services/childService';
import {
  calculateDoctorStatistics,
  calculateParentStatistics,
  DoctorStatistics,
  ParentStatistics,
} from '../services/statisticsService';
import { DoctorDashboardStats, ParentDashboardStats } from '../components/RoleDashboard';

const COLORS = {
  background: '#f2e9e4',
  surface: '#ffffff',
  text: '#333333',
  accentLight: '#b08968',
  accentDark: '#7f5539',
  primary: '#0b6cff',
};

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('parent');
  const [userName, setUserName] = useState<string>('');
  
  // Data
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  
  // Statistics
  const [doctorStats, setDoctorStats] = useState<DoctorStatistics | null>(null);
  const [parentStats, setParentStats] = useState<ParentStatistics | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please login first');
        router.replace('/LoginRegister');
        return;
      }

      // Get user role
      const role = await getUserRole(user.uid);
      setUserRole(role);

      // Load user name
      setUserName(user.displayName || user.email?.split('@')[0] || 'User');

      // Load children
      const childrenData = await getChildrenByUser(user.uid, role);
      setChildren(childrenData);

      // Load all predictions
      const predictionsData = await getAllPredictionsByUser(user.uid, role);
      setPredictions(predictionsData);

      // Calculate statistics based on role
      if (role === 'doctor') {
        const stats = calculateDoctorStatistics(childrenData, predictionsData);
        setDoctorStats(stats);
      } else {
        const stats = calculateParentStatistics(childrenData, predictionsData);
        setParentStats(stats);
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleViewFlagged = () => {
    // Navigate to filtered list showing only flagged cases
    router.push('/children-list?filter=flagged');
  };

  const handleViewFollowUps = () => {
    // Navigate to filtered list showing follow-ups
    router.push('/children-list?filter=followup');
  };

  const handleTakeMeasurement = () => {
    router.push('/home');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>
              {userRole === 'doctor' ? '👨‍⚕️ Doctor Dashboard' : '👨‍👩‍👧‍👦 Family Dashboard'}
            </Text>
            <Text style={styles.nameText}>{userName}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.profileButtonText}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/home')}
          >
            <Text style={styles.actionIcon}>📸</Text>
            <Text style={styles.actionText}>
              {userRole === 'doctor' ? 'Measure Patient' : 'Measure Child'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/children-list')}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionText}>
              {userRole === 'doctor' ? 'View Patients' : 'View Children'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/add-child')}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionText}>
              {userRole === 'doctor' ? 'Add Patient' : 'Add Child'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Role-Based Statistics */}
        <View style={styles.statsContainer}>
          {userRole === 'doctor' && doctorStats ? (
            <DoctorDashboardStats
              stats={doctorStats}
              onViewFlagged={handleViewFlagged}
              onViewFollowUps={handleViewFollowUps}
            />
          ) : parentStats ? (
            <ParentDashboardStats
              stats={parentStats}
              onTakeMeasurement={handleTakeMeasurement}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No data available yet</Text>
              <Text style={styles.noDataSubtext}>
                Start by adding {userRole === 'doctor' ? 'a patient' : 'a child'} and taking measurements
              </Text>
            </View>
          )}
        </View>

        {/* Additional Resources */}
        {userRole === 'doctor' && (
          <View style={styles.resourcesCard}>
            <Text style={styles.resourcesTitle}>📚 Resources</Text>
            <TouchableOpacity style={styles.resourceItem}>
              <Text style={styles.resourceText}>WHO Growth Standards</Text>
              <Text style={styles.resourceArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resourceItem}>
              <Text style={styles.resourceText}>Clinical Guidelines</Text>
              <Text style={styles.resourceArrow}>→</Text>
            </TouchableOpacity>
          </View>
        )}

        {userRole === 'parent' && (
          <View style={styles.resourcesCard}>
            <Text style={styles.resourcesTitle}>💡 Tips for Parents</Text>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>✓</Text>
              <Text style={styles.tipText}>Measure your child monthly for best tracking</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>✓</Text>
              <Text style={styles.tipText}>Take photos in good lighting for accurate results</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>✓</Text>
              <Text style={styles.tipText}>Compare with WHO standards to track development</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  nameText: {
    fontSize: 16,
    color: '#666',
  },
  profileButton: {
    backgroundColor: COLORS.accentDark,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: 20,
  },
  noDataContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  resourcesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  resourcesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  resourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resourceText: {
    fontSize: 15,
    color: COLORS.text,
  },
  resourceArrow: {
    fontSize: 18,
    color: COLORS.primary,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  tipIcon: {
    fontSize: 16,
    color: COLORS.accentDark,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});
