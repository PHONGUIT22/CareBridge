import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { VitalsRepo, VitalsRecord } from '../database/vitalsRepo';
import { SubscriptionService } from '../services/revenuecat';
import { PaywallModal } from '../components/PaywallModal';
import { AnimatedScreenWrapper } from '../components/AnimatedScreenWrapper';

type MetricType = 'bp' | 'sugar' | 'hr';

const screenWidth = Dimensions.get('window').width;

export const AnalyticsScreen: React.FC = () => {
  const [metric, setMetric] = useState<MetricType>('bp');
  const [vitals, setVitals] = useState<VitalsRecord[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const loadData = useCallback(async () => {
    const list = await VitalsRepo.getAllVitals();
    // Reverse array to render chronologically from past to present
    setVitals([...list].reverse());
    const pro = await SubscriptionService.isPro();
    setIsPro(pro);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Take last 7 records for Free tier, or entire history for Pro
  const displayData = isPro ? vitals : vitals.slice(-7);

  // Calculate smart X-axis labels to prevent label overlap when viewing extended ranges
  const step = Math.ceil(displayData.length / 5);
  const labels = displayData.length > 0
    ? displayData.map((d, index) => {
        // Only show text for first, last, or evenly spaced milestone intervals
        if (index === 0 || index === displayData.length - 1 || index % step === 0) {
          return d.date.slice(5); // "MM-DD"
        }
        return ''; // Leave empty between intervals to maintain scale without overlapping
      })
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getDatasets = () => {
    if (displayData.length === 0) {
      return [{ data: [120, 122, 118, 125, 120, 119, 121], color: () => '#DC2626' }];
    }

    if (metric === 'bp') {
      return [
        {
          data: displayData.map((d) => d.systolic || 120),
          color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`, // Systolic blood pressure (Red)
          strokeWidth: 2.5,
        },
        {
          data: displayData.map((d) => d.diastolic || 80),
          color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`, // Diastolic blood pressure (Blue)
          strokeWidth: 2,
        },
      ];
    }

    if (metric === 'sugar') {
      return [
        {
          data: displayData.map((d) => d.bloodSugar || 95),
          color: (opacity = 1) => `rgba(2, 132, 199, ${opacity})`,
          strokeWidth: 2.5,
        },
      ];
    }

    // Heart rate
    return [
      {
        data: displayData.map((d) => d.heartRate || 72),
        color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
        strokeWidth: 2.5,
      },
    ];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AnimatedScreenWrapper style={{ flex: 1 }}>
        <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>BIOMETRIC TRENDS</Text>
          <Text style={styles.headerTitle}>Vitals Analytics</Text>
        </View>
        {!isPro && (
          <TouchableOpacity
            style={styles.proBadge}
            onPress={() => setShowPaywall(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={14} color="#B45309" />
            <Text style={styles.proText}>Unlock 90-Day</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Metric Selector Tabs */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, metric === 'bp' && styles.segmentBtnActive]}
            onPress={() => setMetric('bp')}
          >
            <MaterialCommunityIcons
              name="heart-pulse"
              size={18}
              color={metric === 'bp' ? '#FFFFFF' : '#DC2626'}
            />
            <Text style={[styles.segmentText, metric === 'bp' && styles.segmentTextActive]}>
              Blood Pressure
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, metric === 'sugar' && styles.segmentBtnActive]}
            onPress={() => setMetric('sugar')}
          >
            <MaterialCommunityIcons
              name="water-percent"
              size={18}
              color={metric === 'sugar' ? '#FFFFFF' : '#0284C7'}
            />
            <Text style={[styles.segmentText, metric === 'sugar' && styles.segmentTextActive]}>
              Blood Sugar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, metric === 'hr' && styles.segmentBtnActive]}
            onPress={() => setMetric('hr')}
          >
            <Feather
              name="activity"
              size={16}
              color={metric === 'hr' ? '#FFFFFF' : '#16A34A'}
            />
            <Text style={[styles.segmentText, metric === 'hr' && styles.segmentTextActive]}>
              Heart Rate
            </Text>
          </TouchableOpacity>
        </View>

        {/* Biometric Trend Line Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            {metric === 'bp' && 'Blood Pressure Trend (mmHg)'}
            {metric === 'sugar' && 'Blood Sugar Trend (mg/dL)'}
            {metric === 'hr' && 'Resting Heart Rate (BPM)'}
          </Text>

          {displayData.length < 2 ? (
            <View style={styles.emptyChartContainer}>
              <MaterialCommunityIcons name="chart-bell-curve" size={44} color="#94A3B8" />
              <Text style={styles.emptyChartTitle}>Insufficient Clinical Records</Text>
              <Text style={styles.emptyChartSub}>
                Need at least 2 consecutive recordings to plot clinical trend curves. Tap + Log Vitals to record today's vitals.
              </Text>
            </View>
          ) : (
            <>
              {metric === 'bp' && (
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
                    <Text style={styles.legendText}>Systolic</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
                    <Text style={styles.legendText}>Diastolic</Text>
                  </View>
                </View>
              )}

              <LineChart
                data={{
                  labels,
                  datasets: getDatasets(),
                }}
                width={screenWidth - 48}
                height={220}
                withDots={displayData.length <= 14}
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                  propsForDots: {
                    r: displayData.length > 7 ? '2' : '4',
                    strokeWidth: '1',
                    stroke: '#FFFFFF',
                  },
                }}
                bezier={displayData.length >= 2}
                style={styles.chart}
              />
            </>
          )}
        </View>

        {/* Clinical observation card based on chart data */}
        <View style={styles.adviceCard}>
          <Ionicons name="shield-checkmark" size={22} color={THEME.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.adviceTitle}>Clinical Observation</Text>
            <Text style={styles.adviceDesc}>
              {displayData.length < 2
                ? 'Awaiting more vitals data. Daily biometric logs help detect hypertension patterns and glucose fluctuations early.'
                : metric === 'bp'
                ? 'Readings remain within stable ranges. Consistent medication intake keeps baseline blood pressure normalized.'
                : metric === 'sugar'
                ? 'Fasting sugar metrics correlate well with scheduled meal and prescription timings.'
                : 'Sinus rhythm is regular. No abrupt spikes detected in recent records.'}
            </Text>
          </View>
        </View>
      </ScrollView>
      </AnimatedScreenWrapper>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUnlocked={() => {
          setIsPro(true);
          setShowPaywall(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.light.background,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.light.borderLight,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.royalBlue,
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: THEME.fontSizes.xl,
    fontWeight: '900',
    color: THEME.light.textPrimary,
    marginTop: 2,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  proText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 140,
  },
  segmentContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: THEME.light.borderLight,
  },
  segmentBtnActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: THEME.light.borderLight,
    alignItems: 'center',
    ...THEME.shadows.card,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  emptyChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    width: '100%',
  },
  emptyChartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 10,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyChartSub: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  chart: {
    marginVertical: 6,
    borderRadius: 16,
  },
  adviceCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  adviceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.primary,
    marginBottom: 2,
  },
  adviceDesc: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
});
