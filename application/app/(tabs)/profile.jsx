import React, { useState, useEffect } from "react";
import {
  Alert,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../../config/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getUserRole } from "../../services/childService";

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // User data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [organization, setOrganization] = useState("");
  const [profileCompleted, setProfileCompleted] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Please login first");
        router.push("/LoginRegister");
        return;
      }

      setEmail(user.email || "");

      // Get user role
      const userRole = await getUserRole(user.uid);
      setRole(userRole);

      // Get user profile from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setName(data.name || "");
        setAge(data.age?.toString() || "");
        setWeight(data.weight?.toString() || "");
        setPhone(data.phone || "");
        setOrganization(data.organization || "");
        setProfileCompleted(data.profileCompleted || false);
        
        // If profile is not completed and name is empty, enable editing mode
        if (!data.profileCompleted || !data.name) {
          setIsEditing(true);
        }
      } else {
        // New user, enable editing mode
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "Please login first");
      return;
    }

    // Validation
    if (!name.trim()) {
      Alert.alert("Validation Error", "Name is required");
      return;
    }

    if (age && (isNaN(age) || parseInt(age) < 0 || parseInt(age) > 150)) {
      Alert.alert("Validation Error", "Please enter a valid age (0-150)");
      return;
    }

    if (weight && (isNaN(weight) || parseFloat(weight) < 0)) {
      Alert.alert("Validation Error", "Please enter a valid weight");
      return;
    }

    setSaving(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userData = {
        name: name.trim(),
        email: user.email,
        role: role,
        updatedAt: new Date(),
        profileCompleted: true, // Mark profile as completed
      };

      // Only add optional fields if they have values
      if (age.trim()) userData.age = parseInt(age);
      if (weight.trim()) userData.weight = parseFloat(weight);
      if (phone.trim()) userData.phone = phone.trim();
      if (organization.trim()) userData.organization = organization.trim();

      // Check if document exists
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        await updateDoc(userDocRef, userData);
      } else {
        await setDoc(userDocRef, {
          ...userData,
          createdAt: new Date(),
        });
      }

      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await auth.signOut();
            console.log("User logged out successfully");
            router.replace("/LoginRegister");
          } catch (error) {
            console.error("Error logging out:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  const getRoleLabel = (userRole) => {
    switch (userRole) {
      case "doctor":
        return "Doctor";
      case "parent":
        return "Parent";
      default:
        return "User";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0b6cff" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerSection}>
            <View>
              <Text style={styles.header}>👤 Profile</Text>
              <Text style={styles.roleText}>{getRoleLabel(role)}</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {name ? name.substring(0, 2).toUpperCase() : email.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          {/* Profile Completion Banner */}
          {!profileCompleted && (
            <View style={styles.banner}>
              <Text style={styles.bannerIcon}>ℹ️</Text>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>Complete Your Profile</Text>
                <Text style={styles.bannerText}>
                  Please fill in your details below to get the best experience.
                </Text>
              </View>
            </View>
          )}

          {/* User Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Personal Information</Text>
              {!isEditing && (
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Text style={styles.editLink}>✏️ Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              editable={isEditing}
            />

            <Text style={styles.label}>Age (years)</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={age}
              onChangeText={setAge}
              placeholder="Enter your age"
              keyboardType="numeric"
              editable={isEditing}
            />

            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={weight}
              onChangeText={setWeight}
              placeholder="Enter your weight"
              keyboardType="decimal-pad"
              editable={isEditing}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              editable={isEditing}
            />

            {role === "doctor" ? (
              <>
                <Text style={styles.label}>Organization / Hospital</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={organization}
                  onChangeText={setOrganization}
                  placeholder="Enter your organization"
                  editable={isEditing}
                />
              </>
            ) : null}

            <Text style={styles.label}>Email (Cannot be changed)</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
            />

            {isEditing && (
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setIsEditing(false);
                    loadUserProfile(); // Reset to original values
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Account Info Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Information</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Type:</Text>
              <Text style={styles.infoValue}>{getRoleLabel(role)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
          </View>

          {/* Navigation Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Actions</Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/home")}
            >
              <Text style={styles.actionIcon}>🏠</Text>
              <Text style={styles.actionText}>Go to Home</Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/children-list")}
            >
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionText}>View Children List</Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/add-child")}
            >
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionText}>Add New Child</Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    paddingTop: 60,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#0b6cff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#fff",
  },
  emailText: {
    fontSize: 16,
    color: "#666",
  },
  banner: {
    backgroundColor: "#e3f2fd",
    borderLeftWidth: 4,
    borderLeftColor: "#2196f3",
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  bannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1976d2",
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
  },
  editLink: {
    fontSize: 16,
    color: "#0b6cff",
    fontWeight: "500",
  },
  label: {
    fontSize: 14,
    color: "#555",
    marginBottom: 6,
    marginTop: 12,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333333",
    marginBottom: 8,
  },
  inputDisabled: {
    backgroundColor: "#f5f5f5",
    color: "#999",
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#0b6cff",
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  statusBadge: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  actionArrow: {
    fontSize: 18,
    color: "#0b6cff",
  },
});