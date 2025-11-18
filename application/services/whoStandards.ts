/**
 * WHO Growth Standards and Recommendations
 * Based on WHO Child Growth Standards (2006) and WHO Growth Reference (5-19 years)
 */

interface WHORecommendation {
  height_cm: { min: number; median: number; max: number };
  head_circumference_cm: { min: number; median: number; max: number };
  wrist_circumference_cm: { min: number; median: number; max: number };
  weight_kg: { min: number; median: number; max: number };
}

interface MeasurementComparison {
  measured: number;
  recommended: { min: number; median: number; max: number };
  status: 'below' | 'normal' | 'above';
  percentageDeviation: number;
}

/**
 * Get WHO recommended measurements based on age and gender
 * Age in months, gender: 'male' or 'female'
 */
export function getWHORecommendations(
  ageInMonths: number,
  gender: 'male' | 'female'
): WHORecommendation {
  // Convert to years for easier lookup
  const ageInYears = ageInMonths / 12;

  // WHO data approximations (median ± 2 SD for normal range)
  // This is a simplified version - in production, use complete WHO tables

  let height: { min: number; median: number; max: number };
  let headCirc: { min: number; median: number; max: number };
  let wrist: { min: number; median: number; max: number };
  let weight: { min: number; median: number; max: number };

  if (ageInYears < 2) {
    // Infants (0-24 months)
    const heightMedian = gender === 'male' 
      ? 50 + (ageInMonths * 2.5) 
      : 49.5 + (ageInMonths * 2.4);
    height = { min: heightMedian - 5, median: heightMedian, max: heightMedian + 5 };

    const headCircMedian = gender === 'male'
      ? 34.5 + (ageInMonths * 0.4)
      : 33.9 + (ageInMonths * 0.38);
    headCirc = { min: headCircMedian - 2, median: headCircMedian, max: headCircMedian + 2 };

    const wristMedian = 8.5 + (ageInMonths * 0.15);
    wrist = { min: wristMedian - 0.8, median: wristMedian, max: wristMedian + 0.8 };

    const weightMedian = gender === 'male'
      ? 3.5 + (ageInMonths * 0.45)
      : 3.4 + (ageInMonths * 0.42);
    weight = { min: weightMedian - 1.5, median: weightMedian, max: weightMedian + 1.5 };

  } else if (ageInYears < 5) {
    // Toddlers (2-5 years)
    const heightMedian = gender === 'male'
      ? 85 + ((ageInYears - 2) * 8)
      : 84 + ((ageInYears - 2) * 7.8);
    height = { min: heightMedian - 6, median: heightMedian, max: heightMedian + 6 };

    const headCircMedian = gender === 'male'
      ? 48 + ((ageInYears - 2) * 0.8)
      : 47.5 + ((ageInYears - 2) * 0.75);
    headCirc = { min: headCircMedian - 2, median: headCircMedian, max: headCircMedian + 2 };

    const wristMedian = 12 + ((ageInYears - 2) * 0.4);
    wrist = { min: wristMedian - 0.8, median: wristMedian, max: wristMedian + 0.8 };

    const weightMedian = gender === 'male'
      ? 12 + ((ageInYears - 2) * 2)
      : 11.5 + ((ageInYears - 2) * 1.9);
    weight = { min: weightMedian - 2, median: weightMedian, max: weightMedian + 2 };

  } else if (ageInYears < 10) {
    // Children (5-10 years)
    const heightMedian = gender === 'male'
      ? 109 + ((ageInYears - 5) * 6)
      : 108 + ((ageInYears - 5) * 5.8);
    height = { min: heightMedian - 8, median: heightMedian, max: heightMedian + 8 };

    const headCircMedian = gender === 'male'
      ? 50.5 + ((ageInYears - 5) * 0.4)
      : 50 + ((ageInYears - 5) * 0.35);
    headCirc = { min: headCircMedian - 2, median: headCircMedian, max: headCircMedian + 2 };

    const wristMedian = 13.2 + ((ageInYears - 5) * 0.35);
    wrist = { min: wristMedian - 0.9, median: wristMedian, max: wristMedian + 0.9 };

    const weightMedian = gender === 'male'
      ? 18 + ((ageInYears - 5) * 3)
      : 17.5 + ((ageInYears - 5) * 2.9);
    weight = { min: weightMedian - 3, median: weightMedian, max: weightMedian + 3 };

  } else if (ageInYears < 15) {
    // Pre-teens/Early teens (10-15 years)
    const heightMedian = gender === 'male'
      ? 138 + ((ageInYears - 10) * 7)
      : 137 + ((ageInYears - 10) * 6);
    height = { min: heightMedian - 10, median: heightMedian, max: heightMedian + 10 };

    const headCircMedian = gender === 'male'
      ? 52.5 + ((ageInYears - 10) * 0.3)
      : 52 + ((ageInYears - 10) * 0.25);
    headCirc = { min: headCircMedian - 2, median: headCircMedian, max: headCircMedian + 2 };

    const wristMedian = 14.9 + ((ageInYears - 10) * 0.4);
    wrist = { min: wristMedian - 1, median: wristMedian, max: wristMedian + 1 };

    const weightMedian = gender === 'male'
      ? 33 + ((ageInYears - 10) * 5)
      : 32 + ((ageInYears - 10) * 4.5);
    weight = { min: weightMedian - 5, median: weightMedian, max: weightMedian + 5 };

  } else {
    // Teenagers (15-19 years)
    const heightMedian = gender === 'male'
      ? 168 + ((ageInYears - 15) * 2)
      : 161 + ((ageInYears - 15) * 1);
    height = { min: heightMedian - 12, median: heightMedian, max: heightMedian + 12 };

    const headCircMedian = gender === 'male'
      ? 54 + ((ageInYears - 15) * 0.2)
      : 53.5 + ((ageInYears - 15) * 0.15);
    headCirc = { min: headCircMedian - 2, median: headCircMedian, max: headCircMedian + 2 };

    const wristMedian = gender === 'male' ? 16.5 : 15.2;
    wrist = { min: wristMedian - 1.2, median: wristMedian, max: wristMedian + 1.2 };

    const weightMedian = gender === 'male'
      ? 58 + ((ageInYears - 15) * 3)
      : 52 + ((ageInYears - 15) * 2);
    weight = { min: weightMedian - 8, median: weightMedian, max: weightMedian + 8 };
  }

  return {
    height_cm: height,
    head_circumference_cm: headCirc,
    wrist_circumference_cm: wrist,
    weight_kg: weight,
  };
}

/**
 * Compare measured value with WHO recommendations
 */
export function compareMeasurement(
  measured: number,
  recommended: { min: number; median: number; max: number }
): MeasurementComparison {
  let status: 'below' | 'normal' | 'above';
  let percentageDeviation: number;

  if (measured < recommended.min) {
    status = 'below';
    percentageDeviation = ((measured - recommended.median) / recommended.median) * 100;
  } else if (measured > recommended.max) {
    status = 'above';
    percentageDeviation = ((measured - recommended.median) / recommended.median) * 100;
  } else {
    status = 'normal';
    percentageDeviation = ((measured - recommended.median) / recommended.median) * 100;
  }

  return {
    measured,
    recommended,
    status,
    percentageDeviation,
  };
}

/**
 * Calculate age in months from date of birth
 */
export function calculateAgeInMonths(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  
  const years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();
  
  return years * 12 + months;
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: 'below' | 'normal' | 'above'): string {
  switch (status) {
    case 'below':
      return '#ff6b6b'; // Red
    case 'normal':
      return '#4caf50'; // Green
    case 'above':
      return '#ff9800'; // Orange
  }
}

/**
 * Get status label
 */
export function getStatusLabel(status: 'below' | 'normal' | 'above'): string {
  switch (status) {
    case 'below':
      return 'Below Normal Range';
    case 'normal':
      return 'Within Normal Range';
    case 'above':
      return 'Above Normal Range';
  }
}
