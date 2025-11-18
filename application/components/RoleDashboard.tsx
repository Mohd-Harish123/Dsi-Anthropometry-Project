/**
 * Role-Based Dashboard Component
 * Shows different statistics based on user role
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DoctorStatistics, ParentStatistics } from '../services/statisticsService';

const COLORS = {
  background: '#f2e9e4',
  surface: '#ffffff',
  text: '#333333',
  accentLight: '#b08968',
  accentDark: '#7f5539',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
};

interface DoctorDashboardStatsProps {
  stats: DoctorStatistics;
  onViewFlagged?: () => void;
  onViewFollowUps?: () => void;
}

export function DoctorDashboardStats({ 
  stats, 
  onViewFlagged, 
  onViewFollowUps 
}: DoctorDashboardStatsProps) {
  return (
    <View>
      {/* Statistics Grid */}
      <Text style={styles.sectionTitle}>📊 Practice Overview</Text>
      
      <View style={styles.statsGrid}>
        <StatCard
          label="Total Patients"
          value={stats.totalPatients.toString()}
          icon="👥"
          color={COLORS.info}
        />
        <StatCard
          label="Active This Month"
          value={stats.activePatientsThisMonth.toString()}
          icon="✅"
          color={COLORS.success}
        />
        <StatCard
          label="Flagged Cases"
          value={stats.flaggedCases.toString()}
          icon="⚠️"
          color={COLORS.error}
          onPress={onViewFlagged}
          actionRequired={stats.flaggedCases > 0}
        />
        <StatCard
          label="Follow-ups Due"
          value={stats.pendingFollowUps.toString()}
          icon="📅"
          color={COLORS.warning}
          onPress={onViewFollowUps}
          actionRequired={stats.pendingFollowUps > 0}
        />
      </View>

      {/* Activity Summary */}
      <Text style={styles.sectionTitle}>📈 Recent Activity</Text>
      <View style={styles.activityCard}>
        <View style={styles.activityRow}>
          <Text style={styles.activityLabel}>Measurements This Week</Text>
          <Text style={styles.activityValue}>{stats.measurementsThisWeek}</Text>
        </View>
        <View style={styles.activityRow}>
          <Text style={styles.activityLabel}>Measurements This Month</Text>
          <Text style={styles.activityValue}>{stats.measurementsThisMonth}</Text>
        </View>
      </View>

      {/* Recent Activity List */}
      {stats.recentActivity.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>🕒 Latest Updates</Text>
          <View style={styles.surface}>
            {stats.recentActivity.map((activity, index) => (
              <View 
                key={activity.id || index} 
                style={[
                  styles.activityItem,
                  index < stats.recentActivity.length - 1 && styles.activityItemBorder
                ]}
              >
                <View style={styles.activityContent}>
                  <Text style={[
                    styles.activityDescription,
                    activity.actionRequired && styles.activityUrgent
                  ]}>
                    {activity.description}
                  </Text>
                  <Text style={styles.activityDate}>
                    {formatDate(activity.date)}
                  </Text>
                </View>
                {activity.actionRequired && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>!</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

interface ParentDashboardStatsProps {
  stats: ParentStatistics;
  onTakeMeasurement?: () => void;
}

export function ParentDashboardStats({ 
  stats, 
  onTakeMeasurement 
}: ParentDashboardStatsProps) {
  return (
    <View>
      {/* Overview Cards */}
      <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 Your Family</Text>
      
      <View style={styles.statsGrid}>
        <StatCard
          label="Total Children"
          value={stats.totalChildren.toString()}
          icon="👶"
          color={COLORS.info}
        />
        <StatCard
          label="Total Measurements"
          value={stats.totalMeasurements.toString()}
          icon="📊"
          color={COLORS.success}
        />
      </View>

      {/* Last Measurement Info */}
      {stats.lastMeasurementDate && (
        <View style={[
          styles.surface,
          styles.measurementCard,
          stats.daysSinceLastMeasurement > 30 && styles.warningCard
        ]}>
          <View style={styles.measurementHeader}>
            <Text style={styles.measurementTitle}>
              📅 Last Measurement
            </Text>
            <Text style={[
              styles.daysBadge,
              stats.daysSinceLastMeasurement > 30 && styles.daysBadgeWarning
            ]}>
              {stats.daysSinceLastMeasurement} days ago
            </Text>
          </View>
          
          {stats.latestChild && (
            <View style={styles.latestChildInfo}>
              <Text style={styles.childName}>{stats.latestChild.name}</Text>
              <View style={styles.measurementDetails}>
                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>Height</Text>
                  <Text style={styles.measurementValue}>
                    {stats.latestChild.height.toFixed(1)} cm
                  </Text>
                </View>
                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>Head Circ.</Text>
                  <Text style={styles.measurementValue}>
                    {stats.latestChild.headCirc.toFixed(1)} cm
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          {stats.daysSinceLastMeasurement > 30 && (
            <TouchableOpacity 
              style={styles.reminderButton}
              onPress={onTakeMeasurement}
            >
              <Text style={styles.reminderButtonText}>
                📸 Take New Measurement
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Milestones */}
      {stats.upcomingMilestones.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>🎯 Milestones & Reminders</Text>
          <View style={styles.surface}>
            {stats.upcomingMilestones.map((milestone, index) => (
              <View 
                key={index}
                style={[
                  styles.milestoneItem,
                  index < stats.upcomingMilestones.length - 1 && styles.milestoneItemBorder
                ]}
              >
                <Text style={styles.milestoneText}>{milestone}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Monthly Activity */}
      <View style={styles.activityCard}>
        <Text style={styles.activityCardTitle}>📈 This Month</Text>
        <View style={styles.activityRow}>
          <Text style={styles.activityLabel}>Measurements Taken</Text>
          <Text style={styles.activityValue}>{stats.measurementsThisMonth}</Text>
        </View>
      </View>
    </View>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
  onPress?: () => void;
  actionRequired?: boolean;
}

function StatCard({ label, value, icon, color, onPress, actionRequired }: StatCardProps) {
  const content = (
    <View style={[styles.statCard, onPress && styles.statCardClickable]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {actionRequired && (
        <View style={[styles.actionBadge, { backgroundColor: color }]}>
          <Text style={styles.actionBadgeText}>!</Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.statCardWrapper}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.statCardWrapper}>{content}</View>;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 8,
  },
  statCardWrapper: {
    width: '50%',
    padding: 6,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  statCardClickable: {
    borderWidth: 2,
    borderColor: COLORS.accentLight,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  actionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  surface: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  activityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  activityCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityLabel: {
    fontSize: 15,
    color: '#666',
  },
  activityValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accentDark,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  activityUrgent: {
    fontWeight: '600',
    color: COLORS.error,
  },
  activityDate: {
    fontSize: 12,
    color: '#999',
  },
  urgentBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  urgentText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  measurementCard: {
    marginBottom: 12,
  },
  warningCard: {
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  measurementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  measurementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  daysBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  daysBadgeWarning: {
    backgroundColor: COLORS.warning,
  },
  latestChildInfo: {
    marginBottom: 12,
  },
  childName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accentDark,
    marginBottom: 8,
  },
  measurementDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  measurementItem: {
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  reminderButton: {
    backgroundColor: COLORS.warning,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  reminderButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  milestoneItem: {
    paddingVertical: 12,
  },
  milestoneItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  milestoneText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
});
