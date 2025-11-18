/**
 * WHO Growth Standards Data Service
 * Provides percentile data based on WHO Child Growth Standards
 */

export interface WHOPercentile {
  p3: number;   // 3rd percentile
  p15: number;  // 15th percentile
  p50: number;  // 50th percentile (median)
  p85: number;  // 85th percentile
  p97: number;  // 97th percentile
}

export interface WHOGrowthData {
  ageInMonths: number;
  height: WHOPercentile;
  headCircumference: WHOPercentile;
  weight?: WHOPercentile;
}

/**
 * Get WHO growth standards for a specific age and gender
 */
export function getWHOGrowthStandards(
  ageInMonths: number,
  gender: 'male' | 'female' | 'other'
): WHOGrowthData | null {
  const genderKey = gender === 'female' ? 'female' : 'male';
  
  // WHO Height-for-age percentiles (in cm) - Birth to 10 years
  const heightData: { [key: string]: { [key: number]: WHOPercentile } } = {
    male: {
      0: { p3: 46.1, p15: 47.8, p50: 49.9, p85: 52.0, p97: 53.7 },
      1: { p3: 50.8, p15: 52.7, p50: 54.7, p85: 56.8, p97: 58.6 },
      2: { p3: 54.4, p15: 56.4, p50: 58.4, p85: 60.4, p97: 62.4 },
      3: { p3: 57.3, p15: 59.4, p50: 61.4, p85: 63.5, p97: 65.5 },
      6: { p3: 63.3, p15: 65.5, p50: 67.6, p85: 69.8, p97: 71.9 },
      9: { p3: 67.7, p15: 70.1, p50: 72.0, p85: 74.2, p97: 76.5 },
      12: { p3: 71.0, p15: 73.4, p50: 75.7, p85: 78.1, p97: 80.5 },
      15: { p3: 74.1, p15: 76.6, p50: 79.1, p85: 81.7, p97: 84.2 },
      18: { p3: 76.9, p15: 79.6, p50: 82.3, p85: 85.0, p97: 87.7 },
      21: { p3: 79.6, p15: 82.3, p50: 85.1, p85: 88.0, p97: 90.9 },
      24: { p3: 82.5, p15: 85.1, p50: 87.8, p85: 90.7, p97: 93.0 },
      30: { p3: 87.1, p15: 89.9, p50: 92.3, p85: 95.3, p97: 97.7 },
      36: { p3: 91.0, p15: 93.9, p50: 96.1, p85: 99.1, p97: 101.2 },
      42: { p3: 94.4, p15: 97.6, p50: 100.0, p85: 103.0, p97: 105.3 },
      48: { p3: 98.7, p15: 101.2, p50: 103.9, p85: 106.7, p97: 109.1 },
      54: { p3: 102.0, p15: 104.7, p50: 107.4, p85: 110.2, p97: 112.7 },
      60: { p3: 105.7, p15: 108.0, p50: 110.9, p85: 113.6, p97: 116.1 },
      72: { p3: 111.9, p15: 114.6, p50: 117.4, p85: 120.2, p97: 122.9 },
      84: { p3: 117.6, p15: 120.5, p50: 123.5, p85: 126.6, p97: 129.4 },
      96: { p3: 123.0, p15: 126.1, p50: 129.4, p85: 132.6, p97: 135.7 },
      108: { p3: 128.2, p15: 131.6, p50: 135.1, p85: 138.5, p97: 141.9 },
      120: { p3: 133.3, p15: 137.0, p50: 140.6, p85: 144.2, p97: 147.9 },
    },
    female: {
      0: { p3: 45.4, p15: 47.3, p50: 49.1, p85: 51.0, p97: 52.9 },
      1: { p3: 49.8, p15: 51.7, p50: 53.7, p85: 55.6, p97: 57.6 },
      2: { p3: 53.0, p15: 55.0, p50: 57.1, p85: 59.1, p97: 61.1 },
      3: { p3: 55.6, p15: 57.7, p50: 59.8, p85: 61.9, p97: 64.0 },
      6: { p3: 61.2, p15: 63.5, p50: 65.7, p85: 68.0, p97: 70.3 },
      9: { p3: 66.1, p15: 68.7, p50: 70.4, p85: 72.8, p97: 75.0 },
      12: { p3: 69.2, p15: 71.4, p50: 74.0, p85: 76.6, p97: 78.9 },
      15: { p3: 72.0, p15: 74.8, p50: 77.5, p85: 80.2, p97: 82.9 },
      18: { p3: 74.7, p15: 77.5, p50: 80.7, p85: 83.6, p97: 86.5 },
      21: { p3: 77.2, p15: 80.0, p50: 83.3, p85: 86.7, p97: 89.8 },
      24: { p3: 80.8, p15: 83.2, p50: 86.4, p85: 89.6, p97: 92.0 },
      30: { p3: 85.2, p15: 88.0, p50: 91.1, p85: 94.4, p97: 97.1 },
      36: { p3: 89.4, p15: 92.2, p50: 95.1, p85: 98.3, p97: 100.8 },
      42: { p3: 93.1, p15: 95.9, p50: 98.9, p85: 102.0, p97: 104.5 },
      48: { p3: 97.1, p15: 99.9, p50: 102.7, p85: 105.7, p97: 108.3 },
      54: { p3: 100.6, p15: 103.5, p50: 106.2, p85: 109.2, p97: 111.7 },
      60: { p3: 104.2, p15: 107.0, p50: 109.9, p85: 112.7, p97: 115.6 },
      72: { p3: 110.6, p15: 113.6, p50: 116.7, p85: 119.8, p97: 122.7 },
      84: { p3: 116.5, p15: 119.7, p50: 123.0, p85: 126.3, p97: 129.6 },
      96: { p3: 122.2, p15: 125.7, p50: 129.3, p85: 132.8, p97: 136.4 },
      108: { p3: 127.8, p15: 131.6, p50: 135.5, p85: 139.3, p97: 143.1 },
      120: { p3: 133.4, p15: 137.5, p50: 141.7, p85: 145.8, p97: 149.9 },
    },
  };

  // WHO Head Circumference-for-age percentiles (in cm) - Birth to 5 years
  const headCircData: { [key: string]: { [key: number]: WHOPercentile } } = {
    male: {
      0: { p3: 31.9, p15: 33.2, p50: 34.5, p85: 35.7, p97: 37.0 },
      1: { p3: 35.1, p15: 36.5, p50: 37.8, p85: 39.1, p97: 40.5 },
      2: { p3: 37.3, p15: 38.7, p50: 40.0, p85: 41.5, p97: 42.9 },
      3: { p3: 38.9, p15: 40.3, p50: 41.5, p85: 42.9, p97: 44.3 },
      6: { p3: 40.9, p15: 42.4, p50: 43.3, p85: 44.8, p97: 45.8 },
      9: { p3: 42.5, p15: 44.0, p50: 45.0, p85: 46.3, p97: 47.5 },
      12: { p3: 43.9, p15: 45.0, p50: 46.1, p85: 47.4, p97: 48.3 },
      15: { p3: 44.6, p15: 45.8, p50: 46.6, p85: 47.7, p97: 48.9 },
      18: { p3: 45.3, p15: 46.4, p50: 47.2, p85: 48.3, p97: 49.2 },
      24: { p3: 46.3, p15: 47.3, p50: 48.4, p85: 49.5, p97: 50.5 },
      30: { p3: 46.9, p15: 48.0, p50: 48.9, p85: 50.0, p97: 51.0 },
      36: { p3: 47.6, p15: 48.5, p50: 49.6, p85: 50.5, p97: 51.5 },
      42: { p3: 48.0, p15: 48.9, p50: 49.9, p85: 50.9, p97: 51.9 },
      48: { p3: 48.4, p15: 49.3, p50: 50.3, p85: 51.2, p97: 52.2 },
      54: { p3: 48.7, p15: 49.6, p50: 50.5, p85: 51.5, p97: 52.4 },
      60: { p3: 49.0, p15: 49.9, p50: 50.8, p85: 51.7, p97: 52.6 },
    },
    female: {
      0: { p3: 31.7, p15: 32.7, p50: 33.9, p85: 35.1, p97: 36.1 },
      1: { p3: 34.3, p15: 35.6, p50: 36.5, p85: 37.9, p97: 39.1 },
      2: { p3: 36.1, p15: 37.4, p50: 38.4, p85: 39.8, p97: 41.0 },
      3: { p3: 37.6, p15: 38.9, p50: 39.5, p85: 41.0, p97: 42.2 },
      6: { p3: 39.9, p15: 41.2, p50: 42.2, p85: 43.4, p97: 44.5 },
      9: { p3: 41.5, p15: 42.7, p50: 43.5, p85: 44.7, p97: 45.9 },
      12: { p3: 42.7, p15: 43.8, p50: 45.0, p85: 46.1, p97: 47.2 },
      15: { p3: 43.5, p15: 44.6, p50: 45.6, p85: 46.7, p97: 47.7 },
      18: { p3: 44.2, p15: 45.2, p50: 46.2, p85: 47.2, p97: 48.2 },
      24: { p3: 45.2, p15: 46.2, p50: 47.3, p85: 48.2, p97: 49.4 },
      30: { p3: 45.9, p15: 46.8, p50: 47.8, p85: 48.8, p97: 49.8 },
      36: { p3: 46.5, p15: 47.4, p50: 48.5, p85: 49.4, p97: 50.5 },
      42: { p3: 46.9, p15: 47.8, p50: 48.8, p85: 49.8, p97: 50.8 },
      48: { p3: 47.3, p15: 48.2, p50: 49.2, p85: 50.2, p97: 51.2 },
      54: { p3: 47.6, p15: 48.5, p50: 49.5, p85: 50.5, p97: 51.5 },
      60: { p3: 47.9, p15: 48.8, p50: 49.8, p85: 50.7, p97: 51.7 },
    },
  };

  // Find closest age with available data
  const findClosestAge = (dataSet: { [key: number]: any }, targetAge: number): number => {
    const availableAges = Object.keys(dataSet).map(Number).sort((a, b) => a - b);
    return availableAges.reduce((prev, curr) => 
      Math.abs(curr - targetAge) < Math.abs(prev - targetAge) ? curr : prev
    );
  };

  const closestHeightAge = findClosestAge(heightData[genderKey], ageInMonths);
  const closestHeadAge = findClosestAge(headCircData[genderKey], ageInMonths);

  return {
    ageInMonths: ageInMonths,
    height: heightData[genderKey][closestHeightAge],
    headCircumference: headCircData[genderKey][closestHeadAge],
  };
}

/**
 * Calculate Z-score for a measurement
 */
export function calculateZScore(
  measurement: number,
  median: number,
  sd: number
): number {
  return (measurement - median) / sd;
}

/**
 * Get status interpretation based on percentile
 */
export function getStatusFromPercentile(
  value: number,
  percentiles: WHOPercentile
): 'low' | 'normal' | 'high' {
  if (value < percentiles.p3) return 'low';
  if (value > percentiles.p97) return 'high';
  return 'normal';
}

/**
 * Get status color
 */
export function getStatusColor(status: 'low' | 'normal' | 'high'): string {
  switch (status) {
    case 'low':
      return '#f44336';
    case 'high':
      return '#ff9800';
    case 'normal':
      return '#4caf50';
  }
}

/**
 * Get status label
 */
export function getStatusLabel(status: 'low' | 'normal' | 'high'): string {
  switch (status) {
    case 'low':
      return 'Below Normal';
    case 'high':
      return 'Above Normal';
    case 'normal':
      return 'Normal';
  }
}

/**
 * Calculate age in months from date of birth
 */
export function calculateAgeInMonths(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const months = 
    (today.getFullYear() - birthDate.getFullYear()) * 12 +
    (today.getMonth() - birthDate.getMonth());
  return Math.max(0, months);
}

/**
 * Interpolate between two percentile points
 */
export function interpolatePercentile(
  age: number,
  age1: number,
  age2: number,
  value1: WHOPercentile,
  value2: WHOPercentile
): WHOPercentile {
  const ratio = (age - age1) / (age2 - age1);
  
  return {
    p3: value1.p3 + (value2.p3 - value1.p3) * ratio,
    p15: value1.p15 + (value2.p15 - value1.p15) * ratio,
    p50: value1.p50 + (value2.p50 - value1.p50) * ratio,
    p85: value1.p85 + (value2.p85 - value1.p85) * ratio,
    p97: value1.p97 + (value2.p97 - value1.p97) * ratio,
  };
}
