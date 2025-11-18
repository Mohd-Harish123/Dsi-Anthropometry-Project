/**
 * Medical Notes Component for Doctors
 * Allows doctors to add clinical observations, diagnosis, and flags to measurements
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';

const COLORS = {
  surface: '#ffffff',
  text: '#333333',
  accentLight: '#b08968',
  accentDark: '#7f5539',
  primary: '#0b6cff',
  error: '#f44336',
  warning: '#ff9800',
  success: '#4caf50',
};

interface MedicalNotesProps {
  visible: boolean;
  onClose: () => void;
  onSave: (notes: MedicalNotesData) => void;
  initialData?: MedicalNotesData;
}

export interface MedicalNotesData {
  medicalNotes: string;
  diagnosis: string;
  concerns: string[];
  flagged: boolean;
  followUpDays?: number;
}

const COMMON_CONCERNS = [
  'Below average height',
  'Above average height',
  'Below average head circumference',
  'Above average head circumference',
  'Slow growth velocity',
  'Rapid growth',
  'Nutritional concern',
  'Developmental concern',
];

export function MedicalNotesModal({ visible, onClose, onSave, initialData }: MedicalNotesProps) {
  const [medicalNotes, setMedicalNotes] = useState(initialData?.medicalNotes || '');
  const [diagnosis, setDiagnosis] = useState(initialData?.diagnosis || '');
  const [concerns, setConcerns] = useState<string[]>(initialData?.concerns || []);
  const [flagged, setFlagged] = useState(initialData?.flagged || false);
  const [followUpDays, setFollowUpDays] = useState<string>(
    initialData?.followUpDays?.toString() || ''
  );

  const toggleConcern = (concern: string) => {
    if (concerns.includes(concern)) {
      setConcerns(concerns.filter(c => c !== concern));
    } else {
      setConcerns([...concerns, concern]);
    }
  };

  const handleSave = () => {
    if (flagged && concerns.length === 0) {
      Alert.alert(
        'Incomplete',
        'Please select at least one concern if flagging this measurement.'
      );
      return;
    }

    const data: MedicalNotesData = {
      medicalNotes: medicalNotes.trim(),
      diagnosis: diagnosis.trim(),
      concerns,
      flagged,
    };

    if (followUpDays && !isNaN(parseInt(followUpDays))) {
      data.followUpDays = parseInt(followUpDays);
    }

    onSave(data);
    onClose();
  };

  const handleCancel = () => {
    // Reset to initial data or clear
    setMedicalNotes(initialData?.medicalNotes || '');
    setDiagnosis(initialData?.diagnosis || '');
    setConcerns(initialData?.concerns || []);
    setFlagged(initialData?.flagged || false);
    setFollowUpDays(initialData?.followUpDays?.toString() || '');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Clinical Notes</Text>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Flag Toggle */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Flag for Review</Text>
            <TouchableOpacity
              style={[styles.flagButton, flagged && styles.flagButtonActive]}
              onPress={() => setFlagged(!flagged)}
            >
              <View style={[styles.flagCheckbox, flagged && styles.flagCheckboxActive]}>
                {flagged && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.flagText, flagged && styles.flagTextActive]}>
                This measurement requires attention
              </Text>
            </TouchableOpacity>
          </View>

          {/* Concerns */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Clinical Concerns</Text>
            <View style={styles.concernsGrid}>
              {COMMON_CONCERNS.map((concern) => (
                <TouchableOpacity
                  key={concern}
                  style={[
                    styles.concernChip,
                    concerns.includes(concern) && styles.concernChipActive,
                  ]}
                  onPress={() => toggleConcern(concern)}
                >
                  <Text
                    style={[
                      styles.concernChipText,
                      concerns.includes(concern) && styles.concernChipTextActive,
                    ]}
                  >
                    {concern}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Medical Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Clinical Observations</Text>
            <TextInput
              style={[styles.textArea, styles.input]}
              value={medicalNotes}
              onChangeText={setMedicalNotes}
              placeholder="Enter clinical observations, growth patterns, or other notes..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Diagnosis */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔍 Diagnosis / Assessment</Text>
            <TextInput
              style={styles.input}
              value={diagnosis}
              onChangeText={setDiagnosis}
              placeholder="Enter diagnosis or clinical assessment..."
              placeholderTextColor="#999"
            />
          </View>

          {/* Follow-up */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Follow-up</Text>
            <View style={styles.followUpContainer}>
              <Text style={styles.followUpLabel}>Schedule follow-up in:</Text>
              <View style={styles.followUpInput}>
                <TextInput
                  style={styles.daysInput}
                  value={followUpDays}
                  onChangeText={setFollowUpDays}
                  placeholder="30"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
                <Text style={styles.daysLabel}>days</Text>
              </View>
            </View>
            <View style={styles.followUpPresets}>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => setFollowUpDays('7')}
              >
                <Text style={styles.presetButtonText}>1 week</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => setFollowUpDays('30')}
              >
                <Text style={styles.presetButtonText}>1 month</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => setFollowUpDays('90')}
              >
                <Text style={styles.presetButtonText}>3 months</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Notes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 28,
    color: '#999',
    fontWeight: '300',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  flagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  flagButtonActive: {
    borderColor: COLORS.error,
    backgroundColor: '#fff5f5',
  },
  flagCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagCheckboxActive: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  flagText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
  },
  flagTextActive: {
    color: COLORS.error,
    fontWeight: '600',
  },
  concernsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  concernChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.accentLight,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
  },
  concernChipActive: {
    backgroundColor: COLORS.accentDark,
    borderColor: COLORS.accentDark,
  },
  concernChipText: {
    fontSize: 13,
    color: COLORS.text,
  },
  concernChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  followUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  followUpLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  followUpInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  daysLabel: {
    marginLeft: 8,
    fontSize: 15,
    color: '#666',
  },
  followUpPresets: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.accentLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  presetButtonText: {
    fontSize: 13,
    color: COLORS.accentDark,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
