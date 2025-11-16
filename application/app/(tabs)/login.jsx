import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Login() {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.loginContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>MeasureWise Login</Text>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Email or Username</Text>
            <TextInput
              style={styles.input}
              placeholder="enter your email"
              defaultValue="placeholder@example.com"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry
              defaultValue="any-password"
            />

            {/* Patient Login */}
            <TouchableOpacity
              style={[styles.roleButton, styles.patientButton]}
              onPress={() => router.push("dashboard")}
            >
              <Text style={styles.roleButtonText}>Patient Login</Text>
            </TouchableOpacity>

            {/* Doctor Login */}
            <TouchableOpacity
              style={[styles.roleButton, styles.doctorButton]}
              onPress={() => router.push("doctor_dashboard")}
            >
              <Text style={styles.roleButtonText}>Doctor Login</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            <Text style={styles.link}>Forgot Password?</Text>  |  
            <Text style={styles.link}>  Create Account</Text>
          </Text>

          <Text style={styles.note}>
            *Note: This template accepts any input and redirects based on role.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    backgroundColor: "#f2e9e4",
  },

  loginContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    minHeight: "100%",
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 40,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },

  title: {
    fontSize: 26,
    color: "#7f5539",
    fontWeight: "700",
    marginBottom: 30,
  },

  form: {
    width: "100%",
    alignItems: "center",
  },

  label: {
    width: "90%",
    textAlign: "left",
    marginTop: 5,
    color: "#333",
    fontSize: 14,
  },

  input: {
    width: "90%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#b08968",
    borderRadius: 4,
    padding: 12,
    marginTop: 5,
    marginBottom: 15,
    fontSize: 15,
  },

  roleButton: {
    width: "90%",
    padding: 14,
    borderRadius: 4,
    marginTop: 15,
    alignItems: "center",
  },

  patientButton: {
    backgroundColor: "#7f5539",
  },

  doctorButton: {
    backgroundColor: "#5A5A5A",
    marginTop: 10,
  },

  roleButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  footerText: {
    marginTop: 25,
    fontSize: 13,
    color: "#444",
  },

  link: {
    color: "#7f5539",
    textDecorationLine: "underline",
  },

  note: {
    marginTop: 15,
    fontSize: 11,
    color: "gray",
    textAlign: "center",
  },
});
