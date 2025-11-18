/**
 * API Service for Anthropometry Measurements
 * Connects React Native app to Python Flask backend
 */

// Change this to your actual backend URL
// For local development: use your computer's IP address (not localhost)
// For production: use your deployed server URL
const API_BASE_URL = 'http://192.168.137.242:5001'; // CHANGE THIS TO YOUR IP - PORT CHANGED TO 5001

export interface MeasurementResult {
  success: boolean;
  measurements?: {
    height_cm: number;
    head_circumference_cm: number;
    wrist_circumference_cm: number | null;
    wrist_fallback_used?: boolean;
    pixel_per_cm: number;
  };
  error?: string;
}

/**
 * Send image to backend for analysis
 * @param imageUri - Local URI or base64 string of the image
 * @returns Measurement results
 */
export async function predictMeasurements(imageUri: string): Promise<MeasurementResult> {
  try {
    // Convert image to base64 if it's a file URI
    let base64Image = imageUri;
    
    if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
      // Read file as base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // Send to backend
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get predictions');
    }

    const result: MeasurementResult = await response.json();
    return result;
  } catch (error) {
    console.error('Error predicting measurements:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Check if API server is running
 */
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

/**
 * Get API base URL (useful for debugging)
 */
export function getAPIUrl(): string {
  return API_BASE_URL;
}
