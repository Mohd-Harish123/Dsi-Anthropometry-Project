import { useState } from "react";


import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";

export default function DoctorDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPatient, setExpandedPatient] = useState(null);

  const patients = [
    {
      id: "P-4012",
      name: "Alex Johnson",
      status: "Last measured: 2 days ago",
      statusColor: "#666666",
      lastMeasured: "Nov 10, 2025",
      height: "178.5",
      headCirc: "56.2",
      wristCirc: "16.5"
    },
    {
      id: "P-4013",
      name: "Samantha Lee",
      status: "New baseline required",
      statusColor: "#d32f2f",
      lastMeasured: "Oct 1, 2025",
      height: "165.0",
      headCirc: "54.0",
      wristCirc: "15.2"
    },
    {
      id: "P-4014",
      name: "Michael Chen",
      status: "Last measured: 3 weeks ago",
      statusColor: "#666666",
      lastMeasured: "Oct 20, 2025",
      height: "185.2",
      headCirc: "58.9",
      wristCirc: "18.0"
    }
  ];

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePatient = (patientId) => {
    setExpandedPatient(expandedPatient === patientId ? null : patientId);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.header}>🧑‍⚕️ Patient Directory</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select a Patient to Review</Text>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Patient Name or ID"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <View style={styles.patientList}>
              {filteredPatients.map((patient, index) => (
                <View key={patient.id} style={styles.patientItem}>
                  <Pressable 
                    style={({ pressed }) => [
                      styles.patientToggle,
                      pressed && styles.patientTogglePressed,
                      index !== filteredPatients.length - 1 && styles.patientToggleBorder
                    ]}
                    onPress={() => togglePatient(patient.id)}
                  >
                    <View style={styles.patientInfo}>
                      <Text style={styles.patientName}>
                        {patient.id}: {patient.name}
                      </Text>
                      <Text style={[styles.patientStatus, { color: patient.statusColor }]}>
                        {patient.status}
                      </Text>
                    </View>
                    <Text style={styles.viewLink}>
                      {expandedPatient === patient.id ? "▲" : "▼"}
                    </Text>
                  </Pressable>

                  {expandedPatient === patient.id && (
                    <View style={styles.patientDetailsCard}>
                      <Text style={styles.detailsTitle}>
                        Latest Metrics ({patient.lastMeasured})
                      </Text>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Height:</Text>
                        <Text style={styles.detailValue}>{patient.height} cm</Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Head Circumference:</Text>
                        <Text style={styles.detailValue}>{patient.headCirc} cm</Text>
                      </View>
                      
                      <View style={[styles.detailRow, styles.detailRowLast]}>
                        <Text style={styles.detailLabel}>Wrist Circumference:</Text>
                        <Text style={styles.detailValue}>{patient.wristCirc} cm</Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f2e9e4",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  container: {
    flex: 1,
    backgroundColor: "#f2e9e4",
    padding: 20,
    paddingTop: 40,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 25,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#b08968",
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    color: "#333333",
    marginBottom: 25,
  },
  patientList: {
    marginTop: 0,
  },
  patientItem: {
    marginBottom: 0,
  },
  patientToggle: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  patientToggleBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#b08968",
    borderStyle: "dotted",
  },
  patientTogglePressed: {
    backgroundColor: "#f2e9e4",
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontWeight: "bold",
    color: "#333333",
    fontSize: 16,
    marginBottom: 4,
  },
  patientStatus: {
    fontSize: 13,
    color: "#666666",
  },
  viewLink: {
    color: "#7f5539",
    fontWeight: "bold",
    fontSize: 18,
  },
  patientDetailsCard: {
    padding: 20,
    backgroundColor: "#F9F9F9",
    borderTopWidth: 1,
    borderTopColor: "#b08968",
    marginBottom: 5,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    borderStyle: "dotted",
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666666",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
  },
});