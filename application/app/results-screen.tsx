import React, { useMemo, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  getWHORecommendations, 
  compareMeasurement, 
  calculateAgeInMonths,
  getStatusColor,
  getStatusLabel
} from '../services/whoStandards';
import { getUserRole, UserRole, updatePredictionNotes } from '../services/childService';
import { auth } from '../config/firebase';

interface Measurements {
  height_cm: number;
  head_circumference_cm: number;
  wrist_circumference_cm: number | null;
  wrist_fallback_used?: boolean;
  pixel_per_cm: number;
}

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [userRole, setUserRole] = useState<UserRole>('parent');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const loadUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const role = await getUserRole(user.uid);
        setUserRole(role);
      }
    };
    loadUserRole();
  }, []);
  
  // Parse measurements from params
  const measurements: Measurements = {
    height_cm: parseFloat(params.height_cm as string) || 0,
    head_circumference_cm: parseFloat(params.head_circumference_cm as string) || 0,
    wrist_circumference_cm: params.wrist_circumference_cm ? parseFloat(params.wrist_circumference_cm as string) : null,
    wrist_fallback_used: params.wrist_fallback_used === 'true',
    pixel_per_cm: parseFloat(params.pixel_per_cm as string) || 0,
  };

  const imageUri = params.imageUri as string;
  const childAge = params.childAge as string;
  const childGender = (params.childGender as string) || 'male';
  const childName = params.childName as string;
  const childId = params.childId as string;

  // Calculate WHO recommendations
  const whoData = useMemo(() => {
    if (!childAge) return null;
    
    const ageInMonths = calculateAgeInMonths(childAge);
    const gender = childGender === 'female' ? 'female' : 'male';
    const recommendations = getWHORecommendations(ageInMonths, gender);
    
    return {
      ageInMonths,
      recommendations,
      comparisons: {
        height: compareMeasurement(measurements.height_cm, recommendations.height_cm),
        headCirc: compareMeasurement(measurements.head_circumference_cm, recommendations.head_circumference_cm),
        wrist: measurements.wrist_circumference_cm 
          ? compareMeasurement(measurements.wrist_circumference_cm, recommendations.wrist_circumference_cm)
          : null,
      }
    };
  }, [childAge, childGender, measurements]);

  const handleTakeAnother = () => {
    router.back();
  };

  const handleSaveMedicalNotes = async () => {
    if (!childId || !medicalNotes.trim()) {
      Alert.alert('Error', 'Please enter medical notes before saving');
      return;
    }

    setIsSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      // Update the most recent prediction with medical notes
      await updatePredictionNotes(childId, medicalNotes.trim());
      
      Alert.alert(
        'Success',
        'Medical notes saved successfully',
        [
          {
            text: 'OK',
            onPress: () => router.push('/home')
          }
        ]
      );
    } catch (error) {
      console.error('Error saving medical notes:', error);
      Alert.alert('Error', 'Failed to save medical notes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Measurement Results</Text>
          <Text style={styles.headerSubtitle}>Analysis Complete</Text>
        </View>

        {/* Image Preview */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
          </View>
        )}

        {/* Results Card */}
        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>Anthropometric Measurements</Text>
          
          {/* Height */}
          <View style={styles.measurementRow}>
            <View style={styles.measurementLabel}>
              <Text style={styles.labelText}>Height</Text>
            </View>
            <View style={styles.measurementValue}>
              <Text style={styles.valueNumber}>{measurements.height_cm.toFixed(1)}</Text>
              <Text style={styles.valueUnit}>cm</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Head Circumference */}
          <View style={styles.measurementRow}>
            <View style={styles.measurementLabel}>
              <Text style={styles.labelText}>Head Circumference</Text>
            </View>
            <View style={styles.measurementValue}>
              <Text style={styles.valueNumber}>{measurements.head_circumference_cm.toFixed(1)}</Text>
              <Text style={styles.valueUnit}>cm</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Wrist Circumference */}
          <View style={styles.measurementRow}>
            <View style={styles.measurementLabel}>
              <Text style={styles.labelText}>Wrist Circumference</Text>
              {measurements.wrist_fallback_used && (
                <Text style={styles.fallbackNote}>⚠ Estimated using fallback mechanism</Text>
              )}
            </View>
            <View style={styles.measurementValue}>
              {measurements.wrist_circumference_cm ? (
                <>
                  <Text style={styles.valueNumber}>{measurements.wrist_circumference_cm.toFixed(1)}</Text>
                  <Text style={styles.valueUnit}>cm</Text>
                </>
              ) : (
                <Text style={styles.notDetected}>Not detected</Text>
              )}
            </View>
          </View>
        </View>

        {/* WHO Recommendations Section */}
        {whoData && (
          <View style={styles.whoCard}>
            <View style={styles.whoHeader}>
              <Text style={styles.whoTitle}>📊 WHO Growth Standards</Text>
              <Text style={styles.whoSubtitle}>
                Based on {childName}'s age ({Math.floor(whoData.ageInMonths / 12)} years {whoData.ageInMonths % 12} months) and gender
              </Text>
            </View>

            {/* Height Comparison */}
            <View style={styles.comparisonCard}>
              <View style={styles.comparisonHeader}>
                <Text style={styles.comparisonLabel}>Height</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(whoData.comparisons.height.status) }]}>
                  <Text style={styles.statusBadgeText}>{getStatusLabel(whoData.comparisons.height.status)}</Text>
                </View>
              </View>
              <View style={styles.comparisonValues}>
                <View style={styles.valueColumn}>
                  <Text style={styles.valueLabel}>Measured</Text>
                  <Text style={styles.measuredValue}>{measurements.height_cm.toFixed(1)} cm</Text>
                </View>
                <View style={styles.valueColumn}>
                  <Text style={styles.valueLabel}>WHO Range</Text>
                  <Text style={styles.recommendedValue}>
                    {whoData.recommendations.height_cm.min.toFixed(1)} - {whoData.recommendations.height_cm.max.toFixed(1)} cm
                  </Text>
                  <Text style={styles.medianText}>Median: {whoData.recommendations.height_cm.median.toFixed(1)} cm</Text>
                </View>
              </View>
              <View style={styles.deviationBar}>
                <View style={[styles.deviationFill, { 
                  width: `${Math.min(Math.abs(whoData.comparisons.height.percentageDeviation), 100)}%`,
                  backgroundColor: getStatusColor(whoData.comparisons.height.status)
                }]} />
              </View>
              <Text style={styles.deviationText}>
                {whoData.comparisons.height.percentageDeviation > 0 ? '+' : ''}
                {whoData.comparisons.height.percentageDeviation.toFixed(1)}% from median
              </Text>
            </View>

            {/* Head Circumference Comparison */}
            <View style={styles.comparisonCard}>
              <View style={styles.comparisonHeader}>
                <Text style={styles.comparisonLabel}>Head Circumference</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(whoData.comparisons.headCirc.status) }]}>
                  <Text style={styles.statusBadgeText}>{getStatusLabel(whoData.comparisons.headCirc.status)}</Text>
                </View>
              </View>
              <View style={styles.comparisonValues}>
                <View style={styles.valueColumn}>
                  <Text style={styles.valueLabel}>Measured</Text>
                  <Text style={styles.measuredValue}>{measurements.head_circumference_cm.toFixed(1)} cm</Text>
                </View>
                <View style={styles.valueColumn}>
                  <Text style={styles.valueLabel}>WHO Range</Text>
                  <Text style={styles.recommendedValue}>
                    {whoData.recommendations.head_circumference_cm.min.toFixed(1)} - {whoData.recommendations.head_circumference_cm.max.toFixed(1)} cm
                  </Text>
                  <Text style={styles.medianText}>Median: {whoData.recommendations.head_circumference_cm.median.toFixed(1)} cm</Text>
                </View>
              </View>
              <View style={styles.deviationBar}>
                <View style={[styles.deviationFill, { 
                  width: `${Math.min(Math.abs(whoData.comparisons.headCirc.percentageDeviation), 100)}%`,
                  backgroundColor: getStatusColor(whoData.comparisons.headCirc.status)
                }]} />
              </View>
              <Text style={styles.deviationText}>
                {whoData.comparisons.headCirc.percentageDeviation > 0 ? '+' : ''}
                {whoData.comparisons.headCirc.percentageDeviation.toFixed(1)}% from median
              </Text>
            </View>

            {/* Wrist Circumference Comparison */}
            {whoData.comparisons.wrist && measurements.wrist_circumference_cm && (
              <View style={styles.comparisonCard}>
                <View style={styles.comparisonHeader}>
                  <Text style={styles.comparisonLabel}>Wrist Circumference</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(whoData.comparisons.wrist.status) }]}>
                    <Text style={styles.statusBadgeText}>{getStatusLabel(whoData.comparisons.wrist.status)}</Text>
                  </View>
                </View>
                <View style={styles.comparisonValues}>
                  <View style={styles.valueColumn}>
                    <Text style={styles.valueLabel}>Measured</Text>
                    <Text style={styles.measuredValue}>{measurements.wrist_circumference_cm.toFixed(1)} cm</Text>
                  </View>
                  <View style={styles.valueColumn}>
                    <Text style={styles.valueLabel}>WHO Range</Text>
                    <Text style={styles.recommendedValue}>
                      {whoData.recommendations.wrist_circumference_cm.min.toFixed(1)} - {whoData.recommendations.wrist_circumference_cm.max.toFixed(1)} cm
                    </Text>
                    <Text style={styles.medianText}>Median: {whoData.recommendations.wrist_circumference_cm.median.toFixed(1)} cm</Text>
                  </View>
                </View>
                <View style={styles.deviationBar}>
                  <View style={[styles.deviationFill, { 
                    width: `${Math.min(Math.abs(whoData.comparisons.wrist.percentageDeviation), 100)}%`,
                    backgroundColor: getStatusColor(whoData.comparisons.wrist.status)
                  }]} />
                </View>
                <Text style={styles.deviationText}>
                  {whoData.comparisons.wrist.percentageDeviation > 0 ? '+' : ''}
                  {whoData.comparisons.wrist.percentageDeviation.toFixed(1)}% from median
                </Text>
              </View>
            )}

            <View style={styles.whoNote}>
              <Text style={styles.whoNoteText}>
                ℹ️ These ranges are based on WHO Child Growth Standards. Values outside the normal range should be discussed with a healthcare provider.
              </Text>
            </View>
          </View>
        )}

        {/* Additional Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Calibration Data</Text>
          <Text style={styles.infoText}>
            Pixel per cm: {measurements.pixel_per_cm.toFixed(3)}
          </Text>
          <Text style={styles.infoText}>
            Date: {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Medical Notes Section (Doctors Only) */}
        {userRole === 'doctor' && (
          <View style={styles.medicalNotesCard}>
            <Text style={styles.medicalNotesTitle}>📋 Medical Notes</Text>
            <Text style={styles.medicalNotesSubtitle}>
              Add your clinical observations and remarks for this patient
            </Text>
            
            <TextInput
              style={styles.medicalNotesInput}
              placeholder="Enter clinical observations, diagnosis, treatment recommendations, etc..."
              value={medicalNotes}
              onChangeText={setMedicalNotes}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />

            <TouchableOpacity 
              style={[styles.saveNotesButton, isSaving && styles.saveNotesButtonDisabled]} 
              onPress={handleSaveMedicalNotes}
              disabled={isSaving || !medicalNotes.trim()}
            >
              <Text style={styles.saveNotesButtonText}>
                {isSaving ? 'Saving...' : 'Save Medical Notes'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.buttonPrimary} 
            onPress={handleTakeAnother}
          >
            <Text style={styles.buttonText}>Take Another Measurement</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.buttonSecondary}
            onPress={() => router.push('/home')}
          >
            <Text style={styles.buttonSecondaryText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fb',
  },

  content: {
    padding: 20,
    paddingTop: 60,
  },

  header: {
    marginBottom: 20,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },

  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },

  imageContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },

  resultsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },

  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },

  measurementLabel: {
    flex: 1,
  },

  labelText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },

  fallbackNote: {
    fontSize: 12,
    color: '#ff9800',
    fontStyle: 'italic',
    marginTop: 4,
  },

  measurementValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  valueNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0b6cff',
    marginRight: 6,
  },

  valueUnit: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  notDetected: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },

  divider: {
    height: 1,
    backgroundColor: '#e5e5e5',
  },

  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },

  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },

  actions: {
    gap: 12,
    marginBottom: 40,
  },

  buttonPrimary: {
    backgroundColor: '#0b6cff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  buttonSecondary: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0b6cff',
  },

  buttonSecondaryText: {
    color: '#0b6cff',
    fontSize: 16,
    fontWeight: '600',
  },

  // WHO Standards Styles
  whoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0b6cff',
  },

  whoHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },

  whoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },

  whoSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  comparisonCard: {
    backgroundColor: '#f8f9fc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e8f0',
  },

  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  comparisonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  comparisonValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  valueColumn: {
    flex: 1,
  },

  valueLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    fontWeight: '500',
  },

  measuredValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0b6cff',
  },

  recommendedValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },

  medianText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },

  deviationBar: {
    height: 6,
    backgroundColor: '#e5e5e5',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },

  deviationFill: {
    height: '100%',
    borderRadius: 3,
  },

  deviationText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },

  whoNote: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3',
  },

  whoNoteText: {
    fontSize: 13,
    color: '#1565c0',
    lineHeight: 18,
  },

  // Medical Notes Styles (Doctor only)
  medicalNotesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },

  medicalNotesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },

  medicalNotesSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },

  medicalNotesInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginBottom: 16,
  },

  saveNotesButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  saveNotesButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },

  saveNotesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
