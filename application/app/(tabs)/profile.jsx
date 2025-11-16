import { useState } from "react";
import {
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";

export default function Profile() {
  const [name, setName] = useState("Alex Johnson");
  const [email] = useState("alex.j@example.com");
  const [baselineHeight, setBaselineHeight] = useState("175");
  const [targetHeight, setTargetHeight] = useState("");
  const [units, setUnits] = useState("metric");

  const measurementHistory = [
    { date: "10 Nov 2025", height: "178.5", headCirc: "56.2" },
    { date: "25 Oct 2025", height: "178.0", headCirc: "56.3" },
    { date: "15 Oct 2025", height: "177.5", headCirc: "56.5" },
  ];

  const handleUpdateProfile = () => {
    Alert.alert("Success", "Profile updated successfully!");
  };

  const handleSavePreferences = () => {
    Alert.alert("Success", "Preferences saved!");
  };

  const handleExportData = () => {
    Alert.alert("Export Data", "CSV export feature coming soon!");
  };

  const handleViewReport = (date) => {
    Alert.alert("View Report", `Opening report for ${date}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.header}>⚙️ Profile & Settings</Text>

          {/* User Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>User Details</Text>
            
            <Text style={styles.label}>Name:</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Email:</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
            />

            <Text style={styles.label}>Baseline Height (cm):</Text>
            <TextInput
              style={styles.input}
              value={baselineHeight}
              onChangeText={setBaselineHeight}
              keyboardType="numeric"
            />

            <Pressable 
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={handleUpdateProfile}
            >
              <Text style={styles.buttonText}>Update Profile</Text>
            </Pressable>
          </View>

          {/* Preferences Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Preferences</Text>
            
            <Text style={styles.label}>Measurement Units:</Text>
            
            <Pressable 
              style={styles.radioOption}
              onPress={() => setUnits("metric")}
            >
              <View style={styles.radio}>
                {units === "metric" && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioText}>Metric (cm)</Text>
            </Pressable>

            <Pressable 
              style={styles.radioOption}
              onPress={() => setUnits("imperial")}
            >
              <View style={styles.radio}>
                {units === "imperial" && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioText}>Imperial (in)</Text>
            </Pressable>

            <Text style={[styles.label, { marginTop: 20 }]}>
              Target Height (Optional, cm):
            </Text>
            <TextInput
              style={styles.input}
              value={targetHeight}
              onChangeText={setTargetHeight}
              placeholder="e.g., 180"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />

            <Pressable 
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={handleSavePreferences}
            >
              <Text style={styles.buttonText}>Save Preferences</Text>
            </Pressable>
          </View>

          {/* Measurement History Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Measurement History</Text>
            
            {measurementHistory.map((item, index) => (
              <View 
                key={index} 
                style={[
                  styles.historyItem,
                  index !== measurementHistory.length - 1 && styles.historyItemBorder
                ]}
              >
                <View style={styles.historyTextContainer}>
                  <Text style={styles.historyDate}>{item.date}</Text>
                  <Text style={styles.historyDetails}>
                    Height: {item.height} cm | Head Circ: {item.headCirc} cm
                  </Text>
                </View>
                <Pressable onPress={() => handleViewReport(item.date)}>
                  <Text style={styles.viewReportLink}>View Report →</Text>
                </Pressable>
              </View>
            ))}

            <Pressable 
              style={({ pressed }) => [
                styles.button,
                styles.exportButton,
                pressed && styles.exportButtonPressed
              ]}
              onPress={handleExportData}
            >
              <Text style={styles.buttonText}>Export All Data (CSV)</Text>
            </Pressable>
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
    fontSize: 28,
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
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#333333",
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#b08968",
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    color: "#333333",
    marginBottom: 5,
  },
  inputDisabled: {
    backgroundColor: "#f5f5f5",
    color: "#999",
  },
  button: {
    backgroundColor: "#7f5539",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 15,
  },
  buttonPressed: {
    backgroundColor: "#8D8A80",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#7f5539",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#7f5539",
  },
  radioText: {
    fontSize: 16,
    color: "#333333",
  },
  historyItem: {
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#b08968",
    borderStyle: "dotted",
  },
  historyTextContainer: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  historyDetails: {
    fontSize: 13,
    color: "#666666",
  },
  viewReportLink: {
    fontSize: 14,
    color: "#7f5539",
    fontWeight: "500",
  },
  exportButton: {
    backgroundColor: "#B08B6B",
    marginTop: 25,
  },
  exportButtonPressed: {
    backgroundColor: "#9a7a5f",
  },
});