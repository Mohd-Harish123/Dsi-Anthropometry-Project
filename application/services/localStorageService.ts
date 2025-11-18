/**
 * Local Storage Service (AsyncStorage Fallback)
 * Use this if Firebase is not available or having issues
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'doctor' | 'parent';

export interface ChildProfile {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  guardianName?: string;
  guardianContact?: string;
  createdBy: string;
  createdByRole: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Prediction {
  id: string;
  childId: string;
  childName: string;
  height_cm: number;
  head_circumference_cm: number;
  wrist_circumference_cm: number | null;
  wrist_fallback_used?: boolean;
  pixel_per_cm: number;
  imageUrl?: string;
  createdBy: string;
  createdByRole: UserRole;
  timestamp: string;
  notes?: string;
}

const STORAGE_KEYS = {
  CHILDREN: '@children',
  PREDICTIONS: '@predictions',
  USER_ROLE: '@user_role',
};

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    const children = await getChildrenByUser(userId, userRole);
    
    const newChild: ChildProfile = {
      ...childData,
      id: generateId(),
      createdBy: userId,
      createdByRole: userRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    children.push(newChild);
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.CHILDREN}_${userId}`,
      JSON.stringify(children)
    );

    return newChild.id;
  } catch (error) {
    console.error('Error creating child:', error);
    throw error;
  }
}

/**
 * Get children by user
 */
export async function getChildrenByUser(
  userId: string,
  userRole: UserRole
): Promise<ChildProfile[]> {
  try {
    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.CHILDREN}_${userId}`);
    if (!data) return [];

    const children: ChildProfile[] = JSON.parse(data);
    
    // Sort by updatedAt (most recent first)
    children.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return children;
  } catch (error) {
    console.error('Error getting children:', error);
    return [];
  }
}

/**
 * Get child by ID
 */
export async function getChildById(
  childId: string,
  userId: string,
  userRole: UserRole
): Promise<ChildProfile | null> {
  try {
    const children = await getChildrenByUser(userId, userRole);
    const child = children.find((c) => c.id === childId);
    
    if (!child) return null;
    
    // Check access
    if (child.createdBy !== userId) {
      throw new Error('Access denied');
    }

    return child;
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
    const children = await getChildrenByUser(userId, 'parent'); // Role doesn't matter for retrieval
    const index = children.findIndex((c) => c.id === childId);
    
    if (index === -1) {
      throw new Error('Child not found');
    }

    if (children[index].createdBy !== userId) {
      throw new Error('Access denied');
    }

    children[index] = {
      ...children[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      `${STORAGE_KEYS.CHILDREN}_${userId}`,
      JSON.stringify(children)
    );
  } catch (error) {
    console.error('Error updating child:', error);
    throw error;
  }
}

/**
 * Save prediction
 */
export async function savePrediction(
  childId: string,
  predictionData: Omit<Prediction, 'id' | 'timestamp' | 'createdBy' | 'createdByRole' | 'childId' | 'childName'>,
  userId: string,
  userRole: UserRole
): Promise<string> {
  try {
    // Verify child exists
    const child = await getChildById(childId, userId, userRole);
    if (!child) {
      throw new Error('Child not found');
    }

    if (child.createdBy !== userId) {
      throw new Error('Access denied');
    }

    const predictions = await getPredictionsByChild(childId, userId, userRole);
    
    const newPrediction: Prediction = {
      ...predictionData,
      id: generateId(),
      childId,
      childName: child.name,
      createdBy: userId,
      createdByRole: userRole,
      timestamp: new Date().toISOString(),
    };

    predictions.push(newPrediction);
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.PREDICTIONS}_${childId}`,
      JSON.stringify(predictions)
    );

    // Update child's updatedAt
    await updateChild(childId, {}, userId);

    return newPrediction.id;
  } catch (error) {
    console.error('Error saving prediction:', error);
    throw error;
  }
}

/**
 * Get predictions by child
 */
export async function getPredictionsByChild(
  childId: string,
  userId: string,
  userRole: UserRole
): Promise<Prediction[]> {
  try {
    // Verify access
    const child = await getChildById(childId, userId, userRole);
    if (!child) {
      throw new Error('Child not found');
    }

    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.PREDICTIONS}_${childId}`);
    if (!data) return [];

    const predictions: Prediction[] = JSON.parse(data);
    
    // Sort by timestamp (most recent first)
    predictions.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return predictions;
  } catch (error) {
    console.error('Error getting predictions:', error);
    return [];
  }
}

/**
 * Get latest prediction
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
 * Get all predictions by user
 */
export async function getAllPredictionsByUser(
  userId: string,
  userRole: UserRole
): Promise<Prediction[]> {
  try {
    const children = await getChildrenByUser(userId, userRole);
    const allPredictions: Prediction[] = [];

    for (const child of children) {
      const predictions = await getPredictionsByChild(child.id, userId, userRole);
      allPredictions.push(...predictions);
    }

    // Sort by timestamp
    allPredictions.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return allPredictions;
  } catch (error) {
    console.error('Error getting user predictions:', error);
    return [];
  }
}

/**
 * Get user role
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const role = await AsyncStorage.getItem(`${STORAGE_KEYS.USER_ROLE}_${userId}`);
    return (role as UserRole) || 'parent';
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
    await AsyncStorage.setItem(`${STORAGE_KEYS.USER_ROLE}_${userId}`, role);
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
}
