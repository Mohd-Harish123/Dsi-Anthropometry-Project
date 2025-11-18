import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
  ChildProfile,
  UserRole,
} from '../services/childService';

export default function ChildrenListScreen() {
  const router = useRouter();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('parent');

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please login first');
        router.push('/login');
        return;
      }

      const role = await getUserRole(user.uid);
      setUserRole(role);

      const childrenData = await getChildrenByUser(user.uid, role);
      setChildren(childrenData);
    } catch (error) {
      console.error('Error loading children:', error);
      Alert.alert('Error', 'Failed to load children list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadChildren();
  };

  const handleChildPress = (child: ChildProfile) => {
    router.push({
      pathname: '/child-details',
      params: { childId: child.id },
    });
  };

  const handleAddChild = () => {
    router.push('/add-child');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth.signOut();
              console.log('User logged out successfully');
              router.replace('/LoginRegister');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case 'doctor':
        return 'My Patients';
      case 'healthcare_worker':
        return 'Recorded Children';
      case 'parent':
        return 'My Children';
      default:
        return 'Children';
    }
  };

  const renderChild = ({ item }: { item: ChildProfile }) => {
    const age = calculateAge(item.dateOfBirth);
    const user = auth.currentUser;
    const isAssignedToDoctor = userRole === 'doctor' && item.assignedDoctorId === user?.uid && item.createdBy !== user?.uid;
    
    return (
      <TouchableOpacity
        style={styles.childCard}
        onPress={() => handleChildPress(item)}
      >
        <View style={styles.childHeader}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.childInfo}>
            <View style={styles.childNameRow}>
              <Text style={styles.childName}>{item.name}</Text>
              {isAssignedToDoctor && (
                <View style={styles.assignedBadge}>
                  <Text style={styles.assignedBadgeText}>Assigned</Text>
                </View>
              )}
            </View>
            <Text style={styles.childDetails}>
              {age} • {item.gender.charAt(0).toUpperCase() + item.gender.slice(1)}
            </Text>
            {isAssignedToDoctor && item.assignedDoctorName && (
              <Text style={styles.assignedByLabel}>
                Assigned by Healthcare Worker
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>
            Added {formatDate(item.createdAt.toDate())}
          </Text>
          <Text style={styles.viewDetails}>View Details →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0b6cff" />
        <Text style={styles.loadingText}>Loading children...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{getRoleName(userRole)}</Text>
          <Text style={styles.roleText}>
            {userRole === 'doctor' ? 'Doctor Mode' : userRole === 'healthcare_worker' ? 'Healthcare Worker Mode' : 'Parent Mode'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {children.length} {children.length === 1 ? (userRole === 'doctor' ? 'patient' : 'child') : (userRole === 'doctor' ? 'patients' : 'children')} registered
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.dashboardButton} 
            onPress={() => router.push('/dashboard-stats')}
          >
            <Text style={styles.dashboardButtonText}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
            <Text style={styles.profileButtonText}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Child Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddChild}>
        <Text style={styles.addButtonText}>+ Add New Child</Text>
      </TouchableOpacity>

      {/* Children List */}
      {children.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No children registered yet</Text>
          <Text style={styles.emptySubtext}>
            Tap the button above to add your first child
          </Text>
        </View>
      ) : (
        <FlatList
          data={children}
          renderItem={renderChild}
          keyExtractor={(item) => item.id || ''}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
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
    return `${months + (years * 12)} months`;
  } else if (years === 1) {
    return '1 year';
  } else {
    return `${years} years`;
  }
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return date.toLocaleDateString();
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

  header: {
    backgroundColor: '#0b6cff',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  profileButton: {
    backgroundColor: 'rgba(11, 108, 255, 0.9)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  profileButtonText: {
    color: '#fff',
    fontSize: 20,
  },

  logoutButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },

  roleText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.9,
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },

  dashboardButton: {
    backgroundColor: 'rgba(11, 108, 255, 0.9)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  dashboardButtonText: {
    fontSize: 20,
  },

  addButton: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0b6cff',
    borderStyle: 'dashed',
  },

  addButtonText: {
    color: '#0b6cff',
    fontSize: 16,
    fontWeight: '600',
  },

  listContent: {
    padding: 16,
    paddingTop: 8,
  },

  childCard: {
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

  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0b6cff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  childInfo: {
    flex: 1,
  },

  childNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },

  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  assignedBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  assignedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  assignedByLabel: {
    fontSize: 11,
    color: '#4caf50',
    marginTop: 2,
    fontWeight: '600',
  },

  childDetails: {
    fontSize: 14,
    color: '#666',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },

  footerText: {
    fontSize: 12,
    color: '#999',
  },

  viewDetails: {
    fontSize: 14,
    color: '#0b6cff',
    fontWeight: '600',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },

  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
