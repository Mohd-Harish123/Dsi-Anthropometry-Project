/**
 * Statistics Service
 * Provides role-based analytics and statistics
 */

import { Prediction, ChildProfile, UserRole } from './childService';

export interface DoctorStatistics {
  totalPatients: number;
  activePatientsThisMonth: number;
  flaggedCases: number;
  pendingFollowUps: number;
  measurementsThisWeek: number;
  measurementsThisMonth: number;
  recentActivity: ActivityItem[];
}

export interface ParentStatistics {
  totalChildren: number;
  lastMeasurementDate: Date | null;
  daysSinceLastMeasurement: number;
  totalMeasurements: number;
  measurementsThisMonth: number;
  latestChild?: {
    name: string;
    height: number;
    headCirc: number;
  };
  upcomingMilestones: string[];
}

export interface ActivityItem {
  id: string;
  type: 'measurement' | 'flag' | 'followup' | 'milestone';
  description: string;
  date: Date;
  childName?: string;
  actionRequired?: boolean;
}

/**
 * Calculate statistics for doctors
 */
export function calculateDoctorStatistics(
  children: ChildProfile[],
  predictions: Prediction[]
): DoctorStatistics {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Total patients
  const totalPatients = children.length;
  
  // Active patients this month (had at least one measurement)
  const activePatientsThisMonth = new Set(
    predictions
      .filter(p => p.timestamp.toDate() >= oneMonthAgo)
      .map(p => p.childId)
  ).size;
  
  // Flagged cases
  const flaggedCases = predictions.filter(p => p.flagged).length;
  
  // Pending follow-ups (where follow-up date is in the future)
  const pendingFollowUps = predictions.filter(p => {
    if (!p.followUpDate) return false;
    return p.followUpDate.toDate() >= now;
  }).length;
  
  // Measurements this week
  const measurementsThisWeek = predictions.filter(
    p => p.timestamp.toDate() >= oneWeekAgo
  ).length;
  
  // Measurements this month
  const measurementsThisMonth = predictions.filter(
    p => p.timestamp.toDate() >= oneMonthAgo
  ).length;
  
  // Recent activity
  const recentActivity = generateDoctorActivity(children, predictions, 5);
  
  return {
    totalPatients,
    activePatientsThisMonth,
    flaggedCases,
    pendingFollowUps,
    measurementsThisWeek,
    measurementsThisMonth,
    recentActivity,
  };
}

/**
 * Calculate statistics for parents
 */
export function calculateParentStatistics(
  children: ChildProfile[],
  predictions: Prediction[]
): ParentStatistics {
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Total children
  const totalChildren = children.length;
  
  // Last measurement date
  const sortedPredictions = [...predictions].sort((a, b) => 
    b.timestamp.toMillis() - a.timestamp.toMillis()
  );
  const lastMeasurementDate = sortedPredictions.length > 0 
    ? sortedPredictions[0].timestamp.toDate() 
    : null;
  
  // Days since last measurement
  const daysSinceLastMeasurement = lastMeasurementDate
    ? Math.floor((now.getTime() - lastMeasurementDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  // Total measurements
  const totalMeasurements = predictions.length;
  
  // Measurements this month
  const measurementsThisMonth = predictions.filter(
    p => p.timestamp.toDate() >= oneMonthAgo
  ).length;
  
  // Latest child data
  let latestChild;
  if (sortedPredictions.length > 0) {
    const latest = sortedPredictions[0];
    latestChild = {
      name: latest.childName,
      height: latest.height_cm,
      headCirc: latest.head_circumference_cm,
    };
  }
  
  // Upcoming milestones (mock data - can be enhanced)
  const upcomingMilestones = generateMilestones(children, predictions);
  
  return {
    totalChildren,
    lastMeasurementDate,
    daysSinceLastMeasurement,
    totalMeasurements,
    measurementsThisMonth,
    latestChild,
    upcomingMilestones,
  };
}

/**
 * Generate recent activity for doctors
 */
function generateDoctorActivity(
  children: ChildProfile[],
  predictions: Prediction[],
  limit: number = 5
): ActivityItem[] {
  const activity: ActivityItem[] = [];
  
  // Add flagged measurements
  const flaggedPredictions = predictions
    .filter(p => p.flagged)
    .slice(0, 2);
  
  flaggedPredictions.forEach(p => {
    activity.push({
      id: p.id || '',
      type: 'flag',
      description: `⚠️ Flagged measurement for ${p.childName}`,
      date: p.timestamp.toDate(),
      childName: p.childName,
      actionRequired: true,
    });
  });
  
  // Add recent measurements
  const recentMeasurements = predictions
    .filter(p => !p.flagged)
    .slice(0, 3);
  
  recentMeasurements.forEach(p => {
    activity.push({
      id: p.id || '',
      type: 'measurement',
      description: `📊 New measurement for ${p.childName}: Height ${p.height_cm}cm`,
      date: p.timestamp.toDate(),
      childName: p.childName,
      actionRequired: false,
    });
  });
  
  // Sort by date (most recent first) and limit
  return activity
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}

/**
 * Generate upcoming milestones for parents
 */
function generateMilestones(
  children: ChildProfile[],
  predictions: Prediction[]
): string[] {
  const milestones: string[] = [];
  
  children.forEach(child => {
    const childPredictions = predictions
      .filter(p => p.childId === child.id)
      .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
    
    if (childPredictions.length > 0) {
      const latest = childPredictions[0];
      
      // Check for height milestones
      if (latest.height_cm >= 99 && latest.height_cm < 101) {
        milestones.push(`${child.name} is close to 1 meter tall! 🎉`);
      }
      if (latest.height_cm >= 149 && latest.height_cm < 151) {
        milestones.push(`${child.name} is approaching 1.5 meters! 📏`);
      }
      
      // Measurement reminder
      const daysSince = Math.floor(
        (Date.now() - latest.timestamp.toMillis()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince >= 30) {
        milestones.push(`📅 Time for ${child.name}'s monthly measurement!`);
      }
    } else {
      milestones.push(`📸 Take first measurement for ${child.name}`);
    }
  });
  
  return milestones.slice(0, 3); // Limit to 3 milestones
}

/**
 * Calculate growth velocity (cm per month)
 */
export function calculateGrowthVelocity(predictions: Prediction[]): number | null {
  if (predictions.length < 2) return null;
  
  const sorted = [...predictions].sort((a, b) => 
    a.timestamp.toMillis() - b.timestamp.toMillis()
  );
  
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  
  const heightDiff = last.height_cm - first.height_cm;
  const timeDiff = last.timestamp.toMillis() - first.timestamp.toMillis();
  const monthsDiff = timeDiff / (1000 * 60 * 60 * 24 * 30);
  
  if (monthsDiff === 0) return null;
  
  return heightDiff / monthsDiff;
}

/**
 * Get growth status for doctors
 */
export function getGrowthStatus(prediction: Prediction): {
  status: 'normal' | 'below_average' | 'above_average';
  message: string;
} {
  // Simple heuristic - can be enhanced with WHO standards
  const { height_cm, head_circumference_cm } = prediction;
  
  // These are rough estimates and should be replaced with WHO standards
  if (height_cm < 50 || head_circumference_cm < 30) {
    return {
      status: 'below_average',
      message: 'Measurements below average range',
    };
  }
  
  if (height_cm > 200 || head_circumference_cm > 70) {
    return {
      status: 'above_average',
      message: 'Measurements above average range',
    };
  }
  
  return {
    status: 'normal',
    message: 'Measurements within normal range',
  };
}
