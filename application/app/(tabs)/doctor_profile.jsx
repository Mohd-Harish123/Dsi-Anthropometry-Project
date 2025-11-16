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

export default function DoctorProfile() {
  const [name, setName] = useState("Dr. Eleanor Vance");
  const [practiceId] = useState("MV-0042-DR");
  const [email] = useState("eleanor.vance@clinic.com");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleUpdateDetails = () => {
    Alert.alert("Success", "Account details updated successfully!");
  };

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword) {
      Alert.alert("Error", "Please fill in both password fields");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters");
      return;
    }
    Alert.alert("Success", "Password changed successfully!");
    setOldPassword("");
    setNewPassword("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.header}>🧑‍⚕️ Doctor Profile & Credentials</Text>

          {/* Account Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Details</Text>
            
            <Text style={styles.label}>Full Name:</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Practice ID:</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={practiceId}
              editable={false}
            />

            <Text style={styles.label}>Email (Login):</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
              keyboardType="email-address"
            />

            <Pressable 
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={handleUpdateDetails}
            >
              <Text style={styles.buttonText}>Update Details</Text>
            </Pressable>
          </View>

          {/* Security & Access Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Security & Access</Text>
            
            <Text style={styles.label}>Old Password:</Text>
            <TextInput
              style={styles.input}
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="••••••••"
              placeholderTextColor="#999"
              secureTextEntry
            />

            <Text style={styles.label}>New Password:</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              placeholderTextColor="#999"
              secureTextEntry
            />

            <Pressable 
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={handleChangePassword}
            >
              <Text style={styles.buttonText}>Change Password</Text>
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
});