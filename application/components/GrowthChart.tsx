import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Prediction } from '../services/childService';

interface GrowthChartProps {
  predictions: Prediction[];
  childGender: 'male' | 'female' | 'other';
  childDateOfBirth: string;
  measurementType: 'height' | 'head' | 'wrist';
}

export default function GrowthChart({ 
  predictions, 
  childGender, 
  childDateOfBirth,
  measurementType 
}: GrowthChartProps) {
  const screenWidth = Dimensions.get('window').width - 40;

  // Sort predictions by date
  const sortedPredictions = [...predictions].sort(
    (a, b) => a.timestamp.toMillis() - b.timestamp.toMillis()
  );

  // Calculate age in months for each prediction
  const getAgeInMonths = (predictionDate: Date): number => {
    const birthDate = new Date(childDateOfBirth);
    const months = 
      (predictionDate.getFullYear() - birthDate.getFullYear()) * 12 +
      (predictionDate.getMonth() - birthDate.getMonth());
    return Math.max(0, months);
  };

  // Get measurement value based on type
  const getMeasurementValue = (prediction: Prediction): number => {
    switch (measurementType) {
      case 'height':
        return prediction.height_cm;
      case 'head':
        return prediction.head_circumference_cm;
      case 'wrist':
        return prediction.wrist_circumference_cm || 0;
      default:
        return 0;
    }
  };

  // Get measurement label
  const getMeasurementLabel = (): string => {
    switch (measurementType) {
      case 'height':
        return 'Height (cm)';
      case 'head':
        return 'Head Circumference (cm)';
      case 'wrist':
        return 'Wrist Circumference (cm)';
      default:
        return 'Measurement (cm)';
    }
  };

  // WHO Growth Standards - simplified percentile data (3rd, 50th, 97th percentiles)
  const getWHOPercentiles = (ageInMonths: number): { p3: number; p50: number; p97: number } | null => {
    const gender = childGender === 'female' ? 'female' : 'male';
    
    if (measurementType === 'height') {
      // Height percentiles (simplified WHO data for ages 0-120 months)
      const heightData: { [key: string]: { [key: number]: { p3: number; p50: number; p97: number } } } = {
        male: {
          0: { p3: 46.1, p50: 49.9, p97: 53.7 },
          6: { p3: 63.3, p50: 67.6, p97: 71.9 },
          12: { p3: 71.0, p50: 75.7, p97: 80.5 },
          24: { p3: 82.5, p50: 87.8, p97: 93.0 },
          36: { p3: 91.0, p50: 96.1, p97: 101.2 },
          48: { p3: 98.7, p50: 103.9, p97: 109.1 },
          60: { p3: 105.7, p50: 110.9, p97: 116.1 },
          72: { p3: 111.9, p50: 117.4, p97: 122.9 },
          84: { p3: 117.6, p50: 123.5, p97: 129.4 },
          96: { p3: 123.0, p50: 129.4, p97: 135.7 },
          108: { p3: 128.2, p50: 135.1, p97: 141.9 },
          120: { p3: 133.3, p50: 140.6, p97: 147.9 },
        },
        female: {
          0: { p3: 45.4, p50: 49.1, p97: 52.9 },
          6: { p3: 61.2, p50: 65.7, p97: 70.3 },
          12: { p3: 69.2, p50: 74.0, p97: 78.9 },
          24: { p3: 80.8, p50: 86.4, p97: 92.0 },
          36: { p3: 89.4, p50: 95.1, p97: 100.8 },
          48: { p3: 97.1, p50: 102.7, p97: 108.3 },
          60: { p3: 104.2, p50: 109.9, p97: 115.6 },
          72: { p3: 110.6, p50: 116.7, p97: 122.7 },
          84: { p3: 116.5, p50: 123.0, p97: 129.6 },
          96: { p3: 122.2, p50: 129.3, p97: 136.4 },
          108: { p3: 127.8, p50: 135.5, p97: 143.1 },
          120: { p3: 133.4, p50: 141.7, p97: 149.9 },
        },
      };

      // Find closest age with data
      const availableAges = Object.keys(heightData[gender]).map(Number).sort((a, b) => a - b);
      const closestAge = availableAges.reduce((prev, curr) => 
        Math.abs(curr - ageInMonths) < Math.abs(prev - ageInMonths) ? curr : prev
      );

      return heightData[gender][closestAge];
    } else if (measurementType === 'head') {
      // Head circumference percentiles
      const headData: { [key: string]: { [key: number]: { p3: number; p50: number; p97: number } } } = {
        male: {
          0: { p3: 31.9, p50: 34.5, p97: 37.0 },
          6: { p3: 40.9, p50: 43.3, p97: 45.8 },
          12: { p3: 43.9, p50: 46.1, p97: 48.3 },
          24: { p3: 46.3, p50: 48.4, p97: 50.5 },
          36: { p3: 47.6, p50: 49.6, p97: 51.5 },
          48: { p3: 48.4, p50: 50.3, p97: 52.2 },
          60: { p3: 49.0, p50: 50.8, p97: 52.6 },
        },
        female: {
          0: { p3: 31.7, p50: 33.9, p97: 36.1 },
          6: { p3: 39.9, p50: 42.2, p97: 44.5 },
          12: { p3: 42.7, p50: 45.0, p97: 47.2 },
          24: { p3: 45.2, p50: 47.3, p97: 49.4 },
          36: { p3: 46.5, p50: 48.5, p97: 50.5 },
          48: { p3: 47.3, p50: 49.2, p97: 51.2 },
          60: { p3: 47.9, p50: 49.8, p97: 51.7 },
        },
      };

      const availableAges = Object.keys(headData[gender]).map(Number).sort((a, b) => a - b);
      const closestAge = availableAges.reduce((prev, curr) => 
        Math.abs(curr - ageInMonths) < Math.abs(prev - ageInMonths) ? curr : prev
      );

      return headData[gender][closestAge];
    }

    return null;
  };

  // Prepare chart data
  const chartData = sortedPredictions.map(pred => ({
    age: getAgeInMonths(pred.timestamp.toDate()),
    value: getMeasurementValue(pred),
    date: pred.timestamp.toDate(),
  }));

  if (chartData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No measurements available yet</Text>
      </View>
    );
  }

  // Get age range for WHO percentiles
  const minAge = Math.floor(Math.min(...chartData.map(d => d.age)));
  const maxAge = Math.ceil(Math.max(...chartData.map(d => d.age)));
  const ageRange = Array.from(
    { length: Math.max(12, maxAge - minAge + 1) }, 
    (_, i) => minAge + i
  );

  // Get WHO percentile data for the age range
  const whoP3Data = ageRange.map(age => getWHOPercentiles(age)?.p3 || null).filter(v => v !== null);
  const whoP50Data = ageRange.map(age => getWHOPercentiles(age)?.p50 || null).filter(v => v !== null);
  const whoP97Data = ageRange.map(age => getWHOPercentiles(age)?.p97 || null).filter(v => v !== null);

  // Combine child data with WHO data for display
  const combinedLabels = chartData.map(d => `${d.age}m`);
  const combinedValues = chartData.map(d => d.value);

  const data = {
    labels: combinedLabels,
    datasets: [
      {
        data: combinedValues,
        color: (opacity = 1) => `rgba(11, 108, 255, ${opacity})`,
        strokeWidth: 3,
      },
    ],
    legend: ['Child Measurements'],
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(11, 108, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 1,
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#0b6cff',
    },
  };

  // Calculate statistics
  const latestValue = combinedValues[combinedValues.length - 1];
  const firstValue = combinedValues[0];
  const growth = latestValue - firstValue;
  const growthPercent = ((growth / firstValue) * 100).toFixed(1);

  // Get latest WHO comparison
  const latestAge = chartData[chartData.length - 1].age;
  const latestWHO = getWHOPercentiles(latestAge);

  return (
    <ScrollView style={styles.container} horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Growth Chart - {getMeasurementLabel()}</Text>
          <Text style={styles.subtitle}>
            {chartData.length} measurement{chartData.length !== 1 ? 's' : ''} recorded
          </Text>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Latest</Text>
            <Text style={styles.statValue}>{latestValue.toFixed(1)} cm</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Growth</Text>
            <Text style={[styles.statValue, { color: growth >= 0 ? '#4caf50' : '#f44336' }]}>
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)} cm
            </Text>
            <Text style={styles.statSubtext}>({growthPercent}%)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>
              {Math.round((chartData[chartData.length - 1].age - chartData[0].age))} months
            </Text>
          </View>
        </View>

        {/* WHO Comparison */}
        {latestWHO && (
          <View style={styles.whoCard}>
            <Text style={styles.whoTitle}>WHO Standards Comparison (Age: {latestAge} months)</Text>
            <View style={styles.whoStats}>
              <View style={styles.whoStatItem}>
                <Text style={styles.whoStatLabel}>3rd Percentile</Text>
                <Text style={styles.whoStatValue}>{latestWHO.p3.toFixed(1)} cm</Text>
              </View>
              <View style={styles.whoStatItem}>
                <Text style={styles.whoStatLabel}>50th Percentile</Text>
                <Text style={[styles.whoStatValue, { color: '#0b6cff' }]}>{latestWHO.p50.toFixed(1)} cm</Text>
              </View>
              <View style={styles.whoStatItem}>
                <Text style={styles.whoStatLabel}>97th Percentile</Text>
                <Text style={styles.whoStatValue}>{latestWHO.p97.toFixed(1)} cm</Text>
              </View>
            </View>
            <View style={styles.whoComparison}>
              <Text style={styles.whoComparisonText}>
                Child's measurement: <Text style={{ fontWeight: '700', color: '#0b6cff' }}>{latestValue.toFixed(1)} cm</Text>
              </Text>
              {latestValue < latestWHO.p3 && (
                <Text style={[styles.whoStatus, { color: '#f44336' }]}>⚠️ Below 3rd percentile</Text>
              )}
              {latestValue >= latestWHO.p3 && latestValue <= latestWHO.p97 && (
                <Text style={[styles.whoStatus, { color: '#4caf50' }]}>✓ Within normal range</Text>
              )}
              {latestValue > latestWHO.p97 && (
                <Text style={[styles.whoStatus, { color: '#ff9800' }]}>⚠️ Above 97th percentile</Text>
              )}
            </View>
          </View>
        )}

        {/* Line Chart */}
        <View style={styles.chartContainer}>
          <LineChart
            data={data}
            width={Math.max(screenWidth, chartData.length * 80)}
            height={280}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            yAxisSuffix=" cm"
            withInnerLines
            withOuterLines
            withVerticalLines
            withHorizontalLines
            withVerticalLabels
            withHorizontalLabels
            fromZero={false}
          />
        </View>

        {/* Measurement Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Measurement History</Text>
          {chartData.map((item, index) => (
            <View key={index} style={styles.detailItem}>
              <View style={styles.detailLeft}>
                <Text style={styles.detailAge}>{item.age} months</Text>
                <Text style={styles.detailDate}>
                  {item.date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </Text>
              </View>
              <View style={styles.detailRight}>
                <Text style={styles.detailValue}>{item.value.toFixed(1)} cm</Text>
                {index > 0 && (
                  <Text style={[
                    styles.detailChange,
                    { color: item.value - chartData[index - 1].value >= 0 ? '#4caf50' : '#f44336' }
                  ]}>
                    {item.value - chartData[index - 1].value >= 0 ? '+' : ''}
                    {(item.value - chartData[index - 1].value).toFixed(1)} cm
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Text style={styles.infoNoteText}>
            📊 Growth charts are based on WHO Child Growth Standards. Consult with a healthcare provider for medical advice.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fb',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0b6cff',
  },
  statSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  whoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  whoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  whoStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  whoStatItem: {
    alignItems: 'center',
  },
  whoStatLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  whoStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  whoComparison: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  whoComparisonText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  whoStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  chart: {
    borderRadius: 12,
  },
  detailsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLeft: {
    flex: 1,
  },
  detailAge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  detailDate: {
    fontSize: 12,
    color: '#999',
  },
  detailRight: {
    alignItems: 'flex-end',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b6cff',
    marginBottom: 2,
  },
  detailChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoNote: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0b6cff',
  },
  infoNoteText: {
    fontSize: 12,
    color: '#1565c0',
    lineHeight: 18,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
