import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ImageBackground, 
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  Dimensions,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import * as ImagePicker from 'expo-image-picker';
import { predictMeasurements, checkAPIHealth } from '../services/anthropometryApi';
import { saveMeasurement } from '../services/firestoreService';
import { auth } from '../config/firebase';
import { 
  getChildrenByUser, 
  getUserRole, 
  savePrediction,
  ChildProfile,
  UserRole 
} from '../services/childService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Measurements {
  height_cm: number;
  head_circumference_cm: number;
  wrist_circumference_cm: number | null;
  pixel_per_cm: number;
}

export default function HomeScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [measurements, setMeasurements] = useState<Measurements | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  // Child selection
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('parent');
  const [userName, setUserName] = useState<string>('');

  // Manual entry states
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualHeight, setManualHeight] = useState('');
  const [manualHeadCirc, setManualHeadCirc] = useState('');
  const [manualWristCirc, setManualWristCirc] = useState('');
  const [entryMethod, setEntryMethod] = useState<'photo' | 'manual'>('photo');

  useEffect(() => {
    loadChildren();
    // Check if child was passed as parameter
    if (params.childId && params.childName) {
      setSelectedChild({
        id: params.childId as string,
        name: params.childName as string,
      } as ChildProfile);
    }
  }, []);

  const loadChildren = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No user logged in');
        return;
      }

      console.log('Loading children for user:', user.uid);
      const role = await getUserRole(user.uid);
      console.log('User role:', role);
      setUserRole(role);

      // Load user name from Firestore
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.name) {
            setUserName(userData.name);
          }
        }
      } catch (err) {
        console.log('Could not load user name:', err);
      }

      const childrenData = await getChildrenByUser(user.uid, role);
      console.log('Children loaded:', childrenData.length, childrenData);
      setChildren(childrenData);
      
      if (childrenData.length === 0) {
        console.log('No children found in database');
      }
    } catch (error) {
      console.error('Error loading children:', error);
      Alert.alert('Error', 'Failed to load children. Please try again.');
    }
  };

  // Request camera permissions
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library permissions are required to take photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Take photo with camera
  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1,
        exif: false,
        base64: false,
        // Improved editor UI settings
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setMeasurements(null);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Pick photo from gallery
  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1,
        exif: false,
        base64: false,
        // Improved editor UI settings
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setMeasurements(null);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Generate predictions
  const generatePredictions = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please take or select a photo first.');
      return;
    }

    // Require child selection
    if (!selectedChild) {
      Alert.alert(
        'Select Child',
        'Please select a child before generating measurements.',
        [
          {
            text: 'Select Child',
            onPress: () => setShowChildSelector(true),
          },
          { text: 'Cancel' },
        ]
      );
      return;
    }

    setLoading(true);

    try {
      // Check API health first
      const isHealthy = await checkAPIHealth();
      if (!isHealthy) {
        throw new Error('API server is not running. Please start the Python backend server.');
      }

      // Get predictions from API
      const result = await predictMeasurements(selectedImage);

      if (!result.success || !result.measurements) {
        throw new Error(result.error || 'Failed to get predictions');
      }

      setMeasurements(result.measurements);

      // Save prediction to child's record
      const user = auth.currentUser;
      if (user && selectedChild.id) {
        try {
          const predictionData: any = {
            height_cm: result.measurements.height_cm,
            head_circumference_cm: result.measurements.head_circumference_cm,
            wrist_circumference_cm: result.measurements.wrist_circumference_cm,
            pixel_per_cm: result.measurements.pixel_per_cm,
            imageUrl: selectedImage,
          };
          
          // Only add wrist_fallback_used if it's defined
          if (result.measurements.wrist_fallback_used !== undefined) {
            predictionData.wrist_fallback_used = result.measurements.wrist_fallback_used;
          }
          
          await savePrediction(
            selectedChild.id,
            predictionData,
            user.uid,
            userRole
          );
          console.log('Prediction saved successfully');
        } catch (saveError) {
          // Don't block on save error
          console.log('Prediction save error:', saveError);
        }
      }

      // Navigate to results screen with measurements
      router.push({
        pathname: '/results-screen',
        params: {
          height_cm: result.measurements.height_cm.toString(),
          head_circumference_cm: result.measurements.head_circumference_cm.toString(),
          wrist_circumference_cm: result.measurements.wrist_circumference_cm?.toString() || '',
          wrist_fallback_used: result.measurements.wrist_fallback_used ? 'true' : 'false',
          pixel_per_cm: result.measurements.pixel_per_cm.toString(),
          imageUri: selectedImage,
          childId: selectedChild.id || '',
          childName: selectedChild.name,
          childAge: selectedChild.dateOfBirth || '',
          childGender: selectedChild.gender || '',
        },
      });

    } catch (error) {
      console.error('Error generating predictions:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to generate predictions. Please ensure:\n\n1. The Python backend server is running\n2. The image shows a full body with a 15cm scale\n3. Your device is connected to the same network'
      );
    } finally {
      setLoading(false);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedImage(null);
    setMeasurements(null);
    setShowResults(false);
    setEntryMethod('photo');
    setManualHeight('');
    setManualHeadCirc('');
    setManualWristCirc('');
  };

  // Handle manual entry submission
  const submitManualEntry = async () => {
    // Validate inputs
    if (!manualHeight || !manualHeadCirc) {
      Alert.alert('Missing Data', 'Please enter at least height and head circumference.');
      return;
    }

    const height = parseFloat(manualHeight);
    const headCirc = parseFloat(manualHeadCirc);
    const wristCirc = manualWristCirc ? parseFloat(manualWristCirc) : null;

    // Validate ranges
    if (isNaN(height) || height < 30 || height > 250) {
      Alert.alert('Invalid Height', 'Please enter a valid height between 30 and 250 cm.');
      return;
    }

    if (isNaN(headCirc) || headCirc < 20 || headCirc > 70) {
      Alert.alert('Invalid Head Circumference', 'Please enter a valid head circumference between 20 and 70 cm.');
      return;
    }

    if (wristCirc !== null && (isNaN(wristCirc) || wristCirc < 5 || wristCirc > 30)) {
      Alert.alert('Invalid Wrist Circumference', 'Please enter a valid wrist circumference between 5 and 30 cm.');
      return;
    }

    // Require child selection
    if (!selectedChild) {
      Alert.alert(
        'Select Child',
        'Please select a child before submitting measurements.',
        [
          {
            text: 'Select Child',
            onPress: () => setShowChildSelector(true),
          },
          { text: 'Cancel' },
        ]
      );
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (user && selectedChild.id) {
        // Save manual prediction to child's record
        const predictionData: any = {
          height_cm: height,
          head_circumference_cm: headCirc,
          wrist_circumference_cm: wristCirc,
          pixel_per_cm: 0, // Manual entry, no pixel calculation
        };
        
        await savePrediction(
          selectedChild.id,
          predictionData,
          user.uid,
          userRole
        );
        console.log('Manual measurement saved successfully');
      }

      // Navigate to results screen
      router.push({
        pathname: '/results-screen',
        params: {
          height_cm: height.toString(),
          head_circumference_cm: headCirc.toString(),
          wrist_circumference_cm: wristCirc?.toString() || '',
          wrist_fallback_used: 'false',
          pixel_per_cm: '0',
          imageUri: '',
          childId: selectedChild.id || '',
          childName: selectedChild.name,
          childAge: selectedChild.dateOfBirth || '',
          childGender: selectedChild.gender || '',
        },
      });

      // Reset manual entry fields
      setManualHeight('');
      setManualHeadCirc('');
      setManualWristCirc('');
      setShowManualEntry(false);

    } catch (error) {
      console.error('Error saving manual measurements:', error);
      Alert.alert('Error', 'Failed to save measurements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
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

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Compact Header Section */}
        <ImageBackground
          source={{
            uri: "https://images.unsplash.com/photo-1506765515384-028b60a970df?auto=format&fit=crop&q=60&w=800"
          }}
          style={styles.header}
          imageStyle={{ opacity: 0.35 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerText}>Welcome Back</Text>
              <Text style={styles.subHeaderText} numberOfLines={1}>
                {userName || auth.currentUser?.email?.split('@')[0] || 'User'}
              </Text>
              {userRole && (
                <Text style={styles.roleText}>
                  {userRole === 'doctor' ? 'Doctor' : userRole === 'healthcare_worker' ? 'Healthcare Worker' : 'Parent'}
                </Text>
              )}
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.headerTextButton} 
                onPress={() => router.push('/dashboard-stats')}
                activeOpacity={0.8}
              >
                <Text style={styles.headerButtonText}>Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerTextButton} 
                onPress={() => router.push('/profile')}
                activeOpacity={0.8}
              >
                <Text style={styles.headerButtonText}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.headerTextButton, styles.logoutTextButton]} 
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.headerButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        {/* Main Content Card */}
        <View style={styles.contentWrapper}>
          <View style={styles.card}>
            {/* Title with gradient background */}
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>
                {userRole === 'doctor' ? 'Patient Assessment' : 'Child Anthropometry Assessment'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {userRole === 'doctor' 
                  ? 'Record patient measurements' 
                  : userRole === 'healthcare_worker'
                  ? 'Record child measurements'
                  : 'Measure child growth accurately'}
              </Text>
            </View>

            {/* Child Selection Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SELECT CHILD</Text>
              <TouchableOpacity
                style={styles.childSelectButton}
                onPress={() => setShowChildSelector(true)}
                activeOpacity={0.7}
              >
                <View style={styles.childSelectContent}>
                  <View style={styles.childSelectIndicator}>
                    {selectedChild && <View style={styles.checkmark} />}
                  </View>
                  <Text style={styles.childSelectButtonText}>
                    {selectedChild ? selectedChild.name : 'Tap to select a child'}
                  </Text>
                </View>
                <Text style={styles.childSelectArrow}>›</Text>
              </TouchableOpacity>
              
              {!selectedChild && (
                <TouchableOpacity
                  style={styles.addChildLink}
                  onPress={() => router.push('/add-child')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addChildLinkText}>+ Add New Child</Text>
                </TouchableOpacity>
              )}

              {selectedChild && (
                <TouchableOpacity
                  style={styles.viewPredictionsButton}
                  onPress={() => router.push({
                    pathname: '/previous-predictions' as any,
                    params: { childId: selectedChild.id }
                  })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewPredictionsButtonText}>View History</Text>
                </TouchableOpacity>
              )}

              {children.length > 0 && (
                <TouchableOpacity
                  style={styles.viewAllChildrenLink}
                  onPress={() => router.push('/children-list')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllChildrenText}>
                    📋 View All {userRole === 'doctor' ? 'Patients' : 'Children'} ({children.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Entry Method Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MEASUREMENT METHOD</Text>
              <View style={styles.methodSelector}>
                <TouchableOpacity
                  style={[styles.methodButton, entryMethod === 'photo' && styles.methodButtonActive]}
                  onPress={() => setEntryMethod('photo')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.methodButtonText, entryMethod === 'photo' && styles.methodButtonTextActive]}>
                    Photo Upload
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodButton, entryMethod === 'manual' && styles.methodButtonActive]}
                  onPress={() => setEntryMethod('manual')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.methodButtonText, entryMethod === 'manual' && styles.methodButtonTextActive]}>
                    Manual Entry
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Photo Upload Section */}
            {entryMethod === 'photo' && (
              <>
                {/* Image Preview Section */}
                {selectedImage && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>SELECTED IMAGE</Text>
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                      <TouchableOpacity 
                        style={styles.clearButton} 
                        onPress={clearSelection}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.clearButtonText}>Remove Image</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Action Buttons Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>CAPTURE IMAGE</Text>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.actionButtonSecondary]} 
                      onPress={takePhoto}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <View style={styles.actionButtonIconContainer}>
                        <View style={styles.cameraIcon} />
                      </View>
                      <Text style={styles.actionButtonText}>Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionButton, styles.actionButtonSecondary]} 
                      onPress={pickImage}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <View style={styles.actionButtonIconContainer}>
                        <View style={styles.galleryIcon} />
                      </View>
                      <Text style={styles.actionButtonText}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Generate Button */}
                {selectedImage && (
                  <View style={styles.section}>
                    <TouchableOpacity
                      style={[styles.generateButton, loading && styles.generateButtonDisabled]}
                      onPress={generatePredictions}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator color="#fff" size="small" />
                          <Text style={styles.generateButtonText}>Analyzing...</Text>
                        </View>
                      ) : (
                        <Text style={styles.generateButtonText}>Generate Measurements</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {/* Manual Entry Section */}
            {entryMethod === 'manual' && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>ENTER MEASUREMENTS</Text>
                <View style={styles.manualEntryContainer}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Height (cm) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 120.5"
                      keyboardType="decimal-pad"
                      value={manualHeight}
                      onChangeText={setManualHeight}
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Head Circumference (cm) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 48.2"
                      keyboardType="decimal-pad"
                      value={manualHeadCirc}
                      onChangeText={setManualHeadCirc}
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Wrist Circumference (cm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 13.5 (optional)"
                      keyboardType="decimal-pad"
                      value={manualWristCirc}
                      onChangeText={setManualWristCirc}
                      placeholderTextColor="#999"
                    />
                  </View>

                  <Text style={styles.inputNote}>* Required fields</Text>

                  <TouchableOpacity
                    style={[styles.generateButton, loading && styles.generateButtonDisabled]}
                    onPress={submitManualEntry}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={styles.generateButtonText}>Saving...</Text>
                      </View>
                    ) : (
                      <Text style={styles.generateButtonText}>Submit Measurements</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Child Selector Modal */}
      <Modal
        visible={showChildSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChildSelector(false)}
        onShow={() => {
          // Reload children when modal opens
          console.log('Modal opened, reloading children...');
          loadChildren();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Child</Text>
              <TouchableOpacity onPress={() => setShowChildSelector(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.childList}>
              {children.length === 0 ? (
                <View style={styles.emptyChild}>
                  <Text style={styles.emptyChildText}>No children registered yet</Text>
                  <TouchableOpacity
                    style={styles.modalAddButton}
                    onPress={() => {
                      setShowChildSelector(false);
                      router.push('/add-child' as any);
                    }}
                  >
                    <Text style={styles.modalAddButtonText}>+ Add New Child</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {children.map((child) => (
                    <TouchableOpacity
                      key={child.id}
                      style={[
                        styles.childItem,
                        selectedChild?.id === child.id && styles.childItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedChild(child);
                        setShowChildSelector(false);
                      }}
                    >
                      <View style={styles.childAvatar}>
                        <Text style={styles.childAvatarText}>
                          {child.name.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.childItemInfo}>
                        <Text style={styles.childItemName}>{child.name}</Text>
                        <Text style={styles.childItemDetails}>
                          {child.gender} • {child.dateOfBirth}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Add New Child Option at Bottom */}
                  <TouchableOpacity
                    style={styles.addNewChildOption}
                    onPress={() => {
                      setShowChildSelector(false);
                      router.push('/add-child' as any);
                    }}
                  >
                    <View style={styles.addNewChildIcon}>
                      <Text style={styles.addNewChildIconText}>+</Text>
                    </View>
                    <Text style={styles.addNewChildOptionText}>Add New Child</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6fb",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  // Header styles - more compact
  header: {
    minHeight: 160,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: "#0b6cff",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerLeft: {
    flex: 1,
    marginRight: 12,
  },

  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },

  headerTextButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  logoutTextButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },

  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  headerText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 4,
  },

  subHeaderText: {
    fontSize: 14,
    color: "#eef3ff",
    fontWeight: "500",
  },

  roleText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
    marginTop: 4,
    opacity: 0.9,
  },

  // Content wrapper
  contentWrapper: {
    paddingHorizontal: 16,
    marginTop: -20,
  },

  card: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
  },

  // Card title
  cardTitleContainer: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },

  // Section styling
  section: {
    marginBottom: 20,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Child selection
  childSelectButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#0b6cff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  childSelectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  childSelectIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0b6cff',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkmark: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0b6cff',
  },

  childSelectButtonText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '600',
    flex: 1,
  },

  childSelectArrow: {
    fontSize: 18,
    color: '#0b6cff',
    fontWeight: '600',
  },

  addChildLink: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },

  addChildLinkText: {
    color: '#0b6cff',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  viewPredictionsButton: {
    marginTop: 10,
    backgroundColor: '#0b6cff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  viewPredictionsButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  viewAllChildrenLink: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0b6cff',
  },

  viewAllChildrenText: {
    color: '#0b6cff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Image preview
  imageContainer: {
    alignItems: 'center',
  },

  previewImage: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    resizeMode: 'cover',
    backgroundColor: '#f0f0f0',
  },

  clearButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#ff4444',
    borderRadius: 8,
  },

  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Action buttons
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  actionButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },

  actionButtonSecondary: {
    backgroundColor: '#f0f7ff',
    borderWidth: 2,
    borderColor: '#0b6cff',
  },

  actionButtonIconContainer: {
    width: 36,
    height: 36,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cameraIcon: {
    width: 28,
    height: 22,
    borderWidth: 2,
    borderColor: '#0b6cff',
    borderRadius: 4,
    position: 'relative',
  },

  galleryIcon: {
    width: 28,
    height: 24,
    borderWidth: 2,
    borderColor: '#0b6cff',
    borderRadius: 2,
  },

  actionButtonText: {
    color: '#0b6cff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Generate button
  generateButton: {
    backgroundColor: '#0b6cff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 56,
    elevation: 3,
    shadowColor: '#0b6cff',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  generateButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 0,
    shadowOpacity: 0,
  },

  generateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Info card
  infoCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff9e6',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },

  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 10,
  },

  infoCardContent: {
    gap: 6,
  },

  infoCardItem: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 20,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },

  modalClose: {
    fontSize: 24,
    color: '#999',
    padding: 5,
  },

  childList: {
    padding: 16,
  },

  emptyChild: {
    padding: 40,
    alignItems: 'center',
  },

  emptyChildText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },

  modalAddButton: {
    backgroundColor: '#0b6cff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },

  modalAddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  childItemSelected: {
    backgroundColor: '#e7f3ff',
    borderColor: '#0b6cff',
  },

  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0b6cff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  childAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  childItemInfo: {
    flex: 1,
  },

  childItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },

  childItemDetails: {
    fontSize: 14,
    color: '#666',
  },

  addNewChildOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginTop: 12,
    marginBottom: 8,
    marginHorizontal: 16,
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0b6cff',
    borderStyle: 'dashed',
  },

  addNewChildIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0b6cff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  addNewChildIconText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },

  addNewChildOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0b6cff',
  },

  // Method selector styles
  methodSelector: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 4,
    gap: 8,
  },

  methodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

  methodButtonActive: {
    backgroundColor: '#0b6cff',
    elevation: 2,
    shadowColor: '#0b6cff',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  methodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },

  methodButtonTextActive: {
    color: '#fff',
  },

  // Manual entry styles
  manualEntryContainer: {
    gap: 16,
  },

  inputGroup: {
    gap: 8,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },

  inputNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: -8,
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
