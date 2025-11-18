/**
 * Firestore Service for storing measurement data
 */

import { db, storage } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface MeasurementData {
  userId: string;
  userName: string;
  height_cm: number;
  head_circumference_cm: number;
  wrist_circumference_cm: number | null;
  imageUrl: string;
  timestamp: Timestamp;
  pixel_per_cm?: number;
}

/**
 * Save measurement data to Firestore
 */
export async function saveMeasurement(
  userId: string,
  userName: string,
  measurements: {
    height_cm: number;
    head_circumference_cm: number;
    wrist_circumference_cm: number | null;
    pixel_per_cm?: number;
  },
  imageUri: string
): Promise<string> {
  try {
    // Try to upload image to Firebase Storage, but continue if it fails
    let imageUrl = '';
    try {
      imageUrl = await uploadImage(userId, imageUri);
    } catch (uploadError) {
      // Silent fail - use local URI as fallback
      imageUrl = imageUri;
    }

    // Save measurement data to Firestore
    const measurementData: MeasurementData = {
      userId,
      userName,
      height_cm: measurements.height_cm,
      head_circumference_cm: measurements.head_circumference_cm,
      wrist_circumference_cm: measurements.wrist_circumference_cm,
      imageUrl,
      timestamp: Timestamp.now(),
      pixel_per_cm: measurements.pixel_per_cm,
    };

    const docRef = await addDoc(collection(db, 'measurements'), measurementData);
    
    return docRef.id;
  } catch (error) {
    // Silent fail - don't propagate error
    return 'local-' + Date.now();
  }
}

/**
 * Upload image to Firebase Storage
 */
async function uploadImage(userId: string, imageUri: string): Promise<string> {
  try {
    // Convert image to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create a unique filename
    const timestamp = Date.now();
    const filename = `measurements/${userId}/${timestamp}.jpg`;
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);

    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    // Silent fail
    throw error;
  }
}

/**
 * Get all measurements for a user
 */
export async function getUserMeasurements(userId: string): Promise<MeasurementData[]> {
  try {
    const measurementsQuery = query(
      collection(db, 'measurements'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(measurementsQuery);
    const measurements: MeasurementData[] = [];

    querySnapshot.forEach((doc) => {
      measurements.push({
        ...doc.data() as MeasurementData,
      });
    });

    return measurements;
  } catch (error) {
    console.error('Error getting measurements:', error);
    throw error;
  }
}

/**
 * Get latest measurement for a user
 */
export async function getLatestMeasurement(userId: string): Promise<MeasurementData | null> {
  try {
    const measurements = await getUserMeasurements(userId);
    return measurements.length > 0 ? measurements[0] : null;
  } catch (error) {
    console.error('Error getting latest measurement:', error);
    return null;
  }
}
