/**
 * Child/Patient Service
 * Manages children profiles and their predictions with role-based access control
 */

import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  DocumentData
} from 'firebase/firestore';

export type UserRole = 'doctor' | 'parent' | 'healthcare_worker';

export interface ChildProfile {
  id?: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  guardianName?: string;
  guardianContact?: string;
  createdBy: string; // userId of creator
  createdByRole: UserRole;
  assignedDoctorId?: string; // For healthcare workers
  assignedDoctorName?: string; // For healthcare workers
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Prediction {
  id?: string;
  childId: string;
  childName: string;
  height_cm: number;
  head_circumference_cm: number;
  wrist_circumference_cm: number | null;
  wrist_fallback_used?: boolean;
  pixel_per_cm: number;
  imageUrl?: string;
  createdBy: string; // userId who created the prediction
  createdByRole: UserRole;
  timestamp: Timestamp;
  notes?: string; // General notes (both roles)
  
  // Doctor-specific fields
  medicalNotes?: string;      // Clinical observations
  diagnosis?: string;          // Medical diagnosis
  concerns?: string[];         // Array of concern flags
  followUpDate?: Timestamp;    // Next check-up date
  flagged?: boolean;           // Requires attention
}

/**
 * Create a new child profile
 */
export async function createChild(
  childData: Omit<ChildProfile, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string,
  userRole: UserRole
): Promise<string> {
  try {
    console.log('createChild called with:', { userId, userRole, childName: childData.name });
    
    const newChild: any = {
      name: childData.name,
      dateOfBirth: childData.dateOfBirth,
      gender: childData.gender,
      createdBy: userId,
      createdByRole: userRole,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Only add optional fields if they have values
    if (childData.guardianName && childData.guardianName.trim()) {
      newChild.guardianName = childData.guardianName.trim();
    }
    if (childData.guardianContact && childData.guardianContact.trim()) {
      newChild.guardianContact = childData.guardianContact.trim();
    }

    console.log('Creating child document:', newChild);
    const docRef = await addDoc(collection(db, 'children'), newChild);
    console.log('Child document created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating child:', error);
    throw error;
  }
}

/**
 * Get all doctors (for healthcare worker dropdown)
 */
export async function getAllDoctors(): Promise<Array<{ id: string; name: string; email: string }>> {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'doctor')
    );

    const querySnapshot = await getDocs(usersQuery);
    const doctors: Array<{ id: string; name: string; email: string }> = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      doctors.push({
        id: doc.id,
        name: data.name || data.email || 'Unknown Doctor',
        email: data.email || '',
      });
    });

    return doctors;
  } catch (error) {
    console.error('Error fetching doctors:', error);
    throw error;
  }
}

/**
 * Get children based on user role
 * - Doctors: Only their patients (created by them OR assigned to them)
 * - Parents: Only their children
 * - Healthcare Workers: Only their recorded children
 * - Health Workers: All children they created
 */
export async function getChildrenByUser(
  userId: string,
  userRole: UserRole
): Promise<ChildProfile[]> {
  try {
    console.log('getChildrenByUser called with:', { userId, userRole });
    
    let childrenQuery;
    
    if (userRole === 'doctor') {
      // Doctors see children created by them OR assigned to them
      // We'll need to do two queries and merge results
      const createdQuery = query(
        collection(db, 'children'),
        where('createdBy', '==', userId)
      );
      
      const assignedQuery = query(
        collection(db, 'children'),
        where('assignedDoctorId', '==', userId)
      );
      
      console.log('🔍 Executing queries for doctor with userId:', userId);
      
      try {
        const [createdSnapshot, assignedSnapshot] = await Promise.all([
          getDocs(createdQuery),
          getDocs(assignedQuery)
        ]);
        
        console.log('✅ Query results:');
        console.log('  - Children created by doctor:', createdSnapshot.size);
        console.log('  - Children assigned to doctor:', assignedSnapshot.size);
        
        const children: ChildProfile[] = [];
        const childIds = new Set<string>();
        
        // Add children created by doctor
        createdSnapshot.forEach((doc) => {
          if (!childIds.has(doc.id)) {
            const data = doc.data();
            console.log('  📝 Created child:', { id: doc.id, name: data.name, createdBy: data.createdBy });
            children.push({
              id: doc.id,
              ...data as Omit<ChildProfile, 'id'>,
            });
            childIds.add(doc.id);
          }
        });
        
        // Add children assigned to doctor
        assignedSnapshot.forEach((doc) => {
          if (!childIds.has(doc.id)) {
            const data = doc.data();
            console.log('  🎯 Assigned child:', { 
              id: doc.id, 
              name: data.name, 
              assignedDoctorId: data.assignedDoctorId,
              assignedDoctorName: data.assignedDoctorName,
              createdBy: data.createdBy,
              createdByRole: data.createdByRole
            });
            children.push({
              id: doc.id,
              ...data as Omit<ChildProfile, 'id'>,
            });
            childIds.add(doc.id);
          }
        });
        
        // Sort in memory by updatedAt (most recent first)
        children.sort((a, b) => {
          const aTime = a.updatedAt?.toMillis() || 0;
          const bTime = b.updatedAt?.toMillis() || 0;
          return bTime - aTime;
        });
        
        console.log('✅ Returning', children.length, 'total children for doctor');
        return children;
        
      } catch (queryError: any) {
        console.error('❌ Error executing doctor queries:', queryError);
        console.error('Error details:', {
          message: queryError.message,
          code: queryError.code,
          stack: queryError.stack
        });
        
        // If the assigned query fails due to missing index, fall back to just created children
        if (queryError.code === 'failed-precondition' || queryError.message?.includes('index')) {
          console.warn('⚠️ Firestore index missing for assignedDoctorId query. Creating index...');
          console.warn('Please create a composite index in Firestore Console:');
          console.warn('Collection: children');
          console.warn('Field: assignedDoctorId (Ascending)');
          console.warn('Falling back to showing only created children for now.');
          
          // Return only children created by doctor
          const createdSnapshot = await getDocs(createdQuery);
          const children: ChildProfile[] = [];
          createdSnapshot.forEach((doc) => {
            const data = doc.data();
            children.push({
              id: doc.id,
              ...data as Omit<ChildProfile, 'id'>,
            });
          });
          return children;
        }
        
        throw queryError;
      }
    } else {
      // Parents and healthcare workers see only children they created
      childrenQuery = query(
        collection(db, 'children'),
        where('createdBy', '==', userId)
      );

      console.log('Executing query for', userRole, '...');
      const querySnapshot = await getDocs(childrenQuery);
      console.log('Query completed. Documents found:', querySnapshot.size);
      
      const children: ChildProfile[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Found child document:', { id: doc.id, name: data.name });
        children.push({
          id: doc.id,
          ...data as Omit<ChildProfile, 'id'>,
        });
      });

      // Sort in memory by updatedAt (most recent first)
      children.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis() || 0;
        const bTime = b.updatedAt?.toMillis() || 0;
        return bTime - aTime;
      });

      console.log('Returning', children.length, 'children');
      return children;
    }
  } catch (error) {
    console.error('Error getting children:', error);
    throw error;
  }
}

/**
 * Get a single child by ID
 * Validates that the user has access to this child
 */
export async function getChildById(
  childId: string,
  userId: string,
  userRole: UserRole
): Promise<ChildProfile | null> {
  try {
    const childDoc = await getDoc(doc(db, 'children', childId));
    
    if (!childDoc.exists()) {
      return null;
    }

    const childData = childDoc.data() as ChildProfile;
    
    // Check access: user must be the creator
    if (childData.createdBy !== userId) {
      throw new Error('Access denied: You do not have permission to view this child');
    }

    return {
      id: childDoc.id,
      ...childData,
    };
  } catch (error) {
    console.error('Error getting child:', error);
    throw error;
  }
}

/**
 * Update child profile
 */
export async function updateChild(
  childId: string,
  updates: Partial<ChildProfile>,
  userId: string
): Promise<void> {
  try {
    // Verify user has access
    const childDoc = await getDoc(doc(db, 'children', childId));
    if (!childDoc.exists()) {
      throw new Error('Child not found');
    }

    const childData = childDoc.data() as ChildProfile;
    if (childData.createdBy !== userId) {
      throw new Error('Access denied');
    }

    await updateDoc(doc(db, 'children', childId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating child:', error);
    throw error;
  }
}

/**
 * Save a new prediction for a child
 */
export async function savePrediction(
  childId: string,
  predictionData: Omit<Prediction, 'id' | 'timestamp' | 'createdBy' | 'createdByRole' | 'childId' | 'childName'>,
  userId: string,
  userRole: UserRole
): Promise<string> {
  try {
    console.log('savePrediction called for child:', childId, 'by user:', userId);
    
    // Verify child exists and user has access
    const childDoc = await getDoc(doc(db, 'children', childId));
    if (!childDoc.exists()) {
      throw new Error('Child not found');
    }

    const childData = childDoc.data() as ChildProfile;
    console.log('Child found:', childData.name);
    
    if (childData.createdBy !== userId) {
      throw new Error('Access denied: You can only add predictions for your own children/patients');
    }

    // Build prediction object, excluding undefined values
    const newPrediction: any = {
      childId,
      childName: childData.name,
      height_cm: predictionData.height_cm,
      head_circumference_cm: predictionData.head_circumference_cm,
      wrist_circumference_cm: predictionData.wrist_circumference_cm,
      pixel_per_cm: predictionData.pixel_per_cm,
      createdBy: userId,
      createdByRole: userRole,
      timestamp: Timestamp.now(),
    };

    // Only add optional fields if they are defined
    if (predictionData.wrist_fallback_used !== undefined) {
      newPrediction.wrist_fallback_used = predictionData.wrist_fallback_used;
    }
    if (predictionData.imageUrl !== undefined) {
      newPrediction.imageUrl = predictionData.imageUrl;
    }
    if (predictionData.notes !== undefined && predictionData.notes.trim()) {
      newPrediction.notes = predictionData.notes.trim();
    }
    
    // Add doctor-specific fields if role is doctor
    if (userRole === 'doctor') {
      if ((predictionData as any).medicalNotes) {
        newPrediction.medicalNotes = (predictionData as any).medicalNotes.trim();
      }
      if ((predictionData as any).diagnosis) {
        newPrediction.diagnosis = (predictionData as any).diagnosis.trim();
      }
      if ((predictionData as any).concerns && Array.isArray((predictionData as any).concerns)) {
        newPrediction.concerns = (predictionData as any).concerns;
      }
      if ((predictionData as any).followUpDate) {
        newPrediction.followUpDate = (predictionData as any).followUpDate;
      }
      if ((predictionData as any).flagged !== undefined) {
        newPrediction.flagged = (predictionData as any).flagged;
      }
    }

    console.log('Creating prediction document:', {
      childId,
      height: newPrediction.height_cm,
      head: newPrediction.head_circumference_cm,
      wrist: newPrediction.wrist_circumference_cm,
      wrist_fallback: newPrediction.wrist_fallback_used,
    });

    const docRef = await addDoc(collection(db, 'predictions'), newPrediction);
    console.log('Prediction saved with ID:', docRef.id);
    
    // Update child's last updated timestamp
    await updateDoc(doc(db, 'children', childId), {
      updatedAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error saving prediction:', error);
    throw error;
  }
}

/**
 * Update medical notes for the most recent prediction of a child
 */
export async function updatePredictionNotes(
  childId: string,
  medicalNotes: string
): Promise<void> {
  try {
    // Get the most recent prediction for this child
    const predictionsQuery = query(
      collection(db, 'predictions'),
      where('childId', '==', childId),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(predictionsQuery);
    
    if (querySnapshot.empty) {
      throw new Error('No predictions found for this child');
    }

    // Update the most recent prediction
    const mostRecentPrediction = querySnapshot.docs[0];
    await updateDoc(doc(db, 'predictions', mostRecentPrediction.id), {
      medicalNotes: medicalNotes.trim(),
      updatedAt: Timestamp.now(),
    });

    console.log('Medical notes updated for prediction:', mostRecentPrediction.id);
  } catch (error) {
    console.error('Error updating prediction notes:', error);
    throw error;
  }
}

/**
 * Get all predictions for a specific child
 */
export async function getPredictionsByChild(
  childId: string,
  userId: string,
  userRole: UserRole
): Promise<Prediction[]> {
  try {
    // Verify user has access to this child
    const childDoc = await getDoc(doc(db, 'children', childId));
    if (!childDoc.exists()) {
      throw new Error('Child not found');
    }

    const childData = childDoc.data() as ChildProfile;
    if (childData.createdBy !== userId) {
      throw new Error('Access denied');
    }

    // Simpler query without orderBy to avoid index requirement
    const predictionsQuery = query(
      collection(db, 'predictions'),
      where('childId', '==', childId)
    );

    const querySnapshot = await getDocs(predictionsQuery);
    const predictions: Prediction[] = [];

    querySnapshot.forEach((doc) => {
      predictions.push({
        id: doc.id,
        ...doc.data() as Omit<Prediction, 'id'>,
      });
    });

    // Sort in memory by timestamp (most recent first)
    predictions.sort((a, b) => {
      const aTime = a.timestamp?.toMillis() || 0;
      const bTime = b.timestamp?.toMillis() || 0;
      return bTime - aTime;
    });

    return predictions;
  } catch (error) {
    console.error('Error getting predictions:', error);
    throw error;
  }
}

/**
 * Get latest prediction for a child
 */
export async function getLatestPrediction(
  childId: string,
  userId: string,
  userRole: UserRole
): Promise<Prediction | null> {
  try {
    const predictions = await getPredictionsByChild(childId, userId, userRole);
    return predictions.length > 0 ? predictions[0] : null;
  } catch (error) {
    console.error('Error getting latest prediction:', error);
    return null;
  }
}

/**
 * Get all predictions created by a user
 */
export async function getAllPredictionsByUser(
  userId: string,
  userRole: UserRole
): Promise<Prediction[]> {
  try {
    // Simpler query without orderBy to avoid index requirement
    const predictionsQuery = query(
      collection(db, 'predictions'),
      where('createdBy', '==', userId)
    );

    const querySnapshot = await getDocs(predictionsQuery);
    const predictions: Prediction[] = [];

    querySnapshot.forEach((doc) => {
      predictions.push({
        id: doc.id,
        ...doc.data() as Omit<Prediction, 'id'>,
      });
    });

    // Sort in memory by timestamp (most recent first)
    predictions.sort((a, b) => {
      const aTime = a.timestamp?.toMillis() || 0;
      const bTime = b.timestamp?.toMillis() || 0;
      return bTime - aTime;
    });

    return predictions;
  } catch (error) {
    console.error('Error getting user predictions:', error);
    throw error;
  }
}

/**
 * Get user role from Firestore
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      // Default to parent if no role set
      return 'parent';
    }
    
    const userData = userDoc.data();
    return (userData.role as UserRole) || 'parent';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'parent';
  }
}

/**
 * Set user role
 */
export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
}
