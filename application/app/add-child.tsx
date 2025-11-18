import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { auth } from '../config/firebase';
import { createChild, getUserRole, UserRole, getAllDoctors } from '../services/childService';

export default function AddChildScreen() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('parent');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    guardianName: '',
    guardianContact: '',
  });

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const role = await getUserRole(user.uid);
        setUserRole(role);
        
        // Load doctors list if user is a healthcare worker
        if (role === 'healthcare_worker') {
          const doctorsList = await getAllDoctors();
          setDoctors(doctorsList);
        }
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      setSelectedDate(date);
      // Format date as YYYY-MM-DD
      const formatted = date.toISOString().split('T')[0];
      setFormData({ ...formData, dateOfBirth: formatted });
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Name Required', 'Please enter the child\'s full name to continue.');
      return;
    }
    if (!formData.dateOfBirth.trim()) {
      Alert.alert('Date Required', 'Please select the child\'s date of birth.');
      return;
    }
    
    // Healthcare workers must select a doctor
    if (userRole === 'healthcare_worker' && !selectedDoctorId) {
      Alert.alert('Doctor Required', 'Please select a doctor for this child.');
      return;
    }

    // Validate date is not in the future
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    if (birthDate > today) {
      Alert.alert('Invalid Date', 'Date of birth cannot be in the future.');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please login first');
        router.push('/login');
        return;
      }

      console.log('Creating child with data:', {
        name: formData.name.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        userId: user.uid,
        userRole: userRole,
        assignedDoctorId: selectedDoctorId || undefined,
      });

      const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
      
      const childId = await createChild(
        {
          name: formData.name.trim(),
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          guardianName: formData.guardianName.trim(),
          guardianContact: formData.guardianContact.trim(),
          createdBy: user.uid,
          createdByRole: userRole,
          assignedDoctorId: userRole === 'healthcare_worker' ? selectedDoctorId : undefined,
          assignedDoctorName: userRole === 'healthcare_worker' && selectedDoctor ? selectedDoctor.name : undefined,
        },
        user.uid,
        userRole
      );

      console.log('Child created successfully with ID:', childId);

      Alert.alert('Success', 'Child registered successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error creating child:', error);
      Alert.alert('Error', `Failed to register child: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'doctor':
        return 'Patient';
      case 'parent':
        return 'Child';
      default:
        return 'Child';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add New {getRoleLabel()}</Text>
          <Text style={styles.headerSubtitle}>
            Fill in the details below
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter child's full name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth *</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={showDatePickerModal}
            >
              <Text style={[
                styles.datePickerText,
                !formData.dateOfBirth && styles.datePickerPlaceholder
              ]}>
                {formData.dateOfBirth || '📅 Select Date of Birth'}
              </Text>
            </TouchableOpacity>
            {formData.dateOfBirth && (
              <Text style={styles.hint}>
                Selected: {new Date(formData.dateOfBirth).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            )}
          </View>

          {/* Date Picker Modal */}
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()} // Can't select future dates
              minimumDate={new Date(1900, 0, 1)} // Minimum date
            />
          )}

          {/* iOS: Done button for date picker */}
          {showDatePicker && Platform.OS === 'ios' && (
            <View style={styles.datePickerActions}>
              <TouchableOpacity
                style={styles.datePickerDoneButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Gender */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender *</Text>
            <View style={styles.genderButtons}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'male' && styles.genderButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, gender: 'male' })}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    formData.gender === 'male' && styles.genderButtonTextActive,
                  ]}
                >
                  Male
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'female' && styles.genderButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, gender: 'female' })}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    formData.gender === 'female' && styles.genderButtonTextActive,
                  ]}
                >
                  Female
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'other' && styles.genderButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, gender: 'other' })}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    formData.gender === 'other' && styles.genderButtonTextActive,
                  ]}
                >
                  Other
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Doctor Selection (Healthcare Workers Only) */}
          {userRole === 'healthcare_worker' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Assign to Doctor *</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      'Select Doctor',
                      'Choose a doctor for this child',
                      [
                        ...doctors.map(doctor => ({
                          text: `${doctor.name} (${doctor.email})`,
                          onPress: () => setSelectedDoctorId(doctor.id)
                        })),
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <Text style={[
                    styles.pickerButtonText,
                    !selectedDoctorId && styles.pickerPlaceholder
                  ]}>
                    {selectedDoctorId 
                      ? doctors.find(d => d.id === selectedDoctorId)?.name || 'Select Doctor'
                      : 'Select Doctor'}
                  </Text>
                </TouchableOpacity>
              </View>
              {selectedDoctorId && (
                <Text style={styles.hint}>
                  Doctor: {doctors.find(d => d.id === selectedDoctorId)?.email}
                </Text>
              )}
            </View>
          )}

          {/* Guardian Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Guardian Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter guardian's name (optional)"
              value={formData.guardianName}
              onChangeText={(text) =>
                setFormData({ ...formData, guardianName: text })
              }
            />
          </View>

          {/* Guardian Contact */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Guardian Contact</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone or email (optional)"
              value={formData.guardianContact}
              onChangeText={(text) =>
                setFormData({ ...formData, guardianContact: text })
              }
              keyboardType="email-address"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : 'Register Child'}
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
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
    flex: 1,
  },

  header: {
    backgroundColor: '#0b6cff',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },

  form: {
    padding: 20,
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },

  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },

  datePickerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  datePickerText: {
    fontSize: 16,
    color: '#333',
  },

  datePickerPlaceholder: {
    color: '#999',
  },

  datePickerActions: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'flex-end',
  },

  datePickerDoneButton: {
    backgroundColor: '#0b6cff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },

  datePickerDoneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  genderButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },

  genderButtonActive: {
    backgroundColor: '#0b6cff',
    borderColor: '#0b6cff',
  },

  genderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },

  genderButtonTextActive: {
    color: '#fff',
  },

  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  pickerButton: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },

  pickerPlaceholder: {
    color: '#999',
  },

  submitButton: {
    backgroundColor: '#0b6cff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },

  submitButtonDisabled: {
    opacity: 0.6,
  },

  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  cancelButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },

  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
