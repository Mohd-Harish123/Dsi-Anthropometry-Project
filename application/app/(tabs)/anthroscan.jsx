import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

// Change this to your backend URL
const BACKEND_URL = "http://YOUR_BACKEND_URL/analyze";

export default function AnthroScan() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const pickImage = async () => {
    setError(null);
    setResult(null);
    
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError("Permission denied. Please enable photo library access in settings.");
        return;
      }

      const img = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        base64: false,
      });

      if (!img.canceled && img.assets && img.assets.length > 0) {
        setImage(img.assets[0]);
      }
    } catch (e) {
      setError("Failed to pick image: " + e.message);
    }
  };

  const submitImage = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let base64;
      
      // Handle web differently from native
      if (Platform.OS === 'web') {
        // For web, fetch the blob and convert to base64
        const response = await fetch(image.uri);
        const blob = await response.blob();
        base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // For native (iOS/Android), use FileSystem
        const fileUri = image.uri;
        base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: "base64",
        });
      }

      const payload = { image_base64: base64 };

      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      
      if (!data || typeof data !== 'object') {
        throw new Error("Invalid response from server");
      }
      
      setResult(data);
    } catch (e) {
      setError("Failed to analyze image: " + e.message);
      console.error("Analysis error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.header}>BabyWell</Text>
          
          <View style={styles.card}>
            <Pressable 
              style={({ pressed }) => [
                styles.dropZone,
                pressed && styles.dropZonePressed
              ]} 
              onPress={pickImage}
              disabled={loading}
            >
              <Text style={styles.dropZoneText}>
                {image ? "Image Selected" : "Tap to Select Image"}
              </Text>
              {!image && (
                <Text style={styles.dropZoneSubtext}>
                  Choose a photo from your library
                </Text>
              )}
            </Pressable>

            {image && (
              <Image 
                source={{ uri: image.uri }} 
                style={styles.preview}
                resizeMode="contain"
              />
            )}

            {image && !loading && (
              <Pressable 
                style={({ pressed }) => [
                  styles.button, 
                  pressed && styles.buttonPressed
                ]} 
                onPress={submitImage}
              >
                <Text style={styles.buttonText}>Run Analysis</Text>
              </Pressable>
            )}

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7f5539" />
                <Text style={styles.loadingText}>Analyzing image...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          {result && (
            <View style={styles.statGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {result.height_cm ? `${result.height_cm}` : 'N/A'}
                </Text>
                <Text style={styles.statLabel}>Height (cm)</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {result.wrist_cm ? `${result.wrist_cm}` : 'N/A'}
                </Text>
                <Text style={styles.statLabel}>Wrist (cm)</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {result.head_cm ? `${result.head_cm}` : 'N/A'}
                </Text>
                <Text style={styles.statLabel}>Head (cm)</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {result.confidence_score ? result.confidence_score : 'N/A'}
                </Text>
                <Text style={styles.statLabel}>Confidence</Text>
              </View>
            </View>
          )}
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
  },
  container: {
    flex: 1,
    backgroundColor: "#f2e9e4",
    padding: 20,
    paddingTop: 40,
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 20,
    textAlign: "center",
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
    alignItems: "center",
  },
  dropZone: {
    width: "90%",
    padding: 30,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#b08968",
    borderRadius: 4,
    backgroundColor: "#f2e9e4",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
    marginVertical: 15,
  },
  dropZonePressed: {
    backgroundColor: "#e8dfd8",
  },
  dropZoneText: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "600",
    marginBottom: 5,
  },
  dropZoneSubtext: {
    fontSize: 14,
    color: "#666666",
  },
  preview: {
    width: "90%",
    height: 260,
    marginTop: 15,
    marginBottom: 15,
    borderRadius: 4,
    backgroundColor: "#f2e9e4",
  },
  button: {
    backgroundColor: "#7f5539",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 4,
    marginTop: 10,
    width: "90%",
    alignItems: "center",
  },
  buttonPressed: {
    backgroundColor: "#8D8A80",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  loadingText: {
    color: "#7f5539",
    marginTop: 10,
    fontSize: 14,
  },
  errorBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#fef5f5",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#d32f2f",
    width: "90%",
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
  },
  statGrid: {
    marginTop: 20,
    gap: 15,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#b08968",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#7f5539",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});