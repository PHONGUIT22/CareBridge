import { useState, useEffect, useCallback } from 'react';
import { LogRepo, DailyLogItem } from '../database/logRepo';
import { getWeekdayName, formatToISODate } from '../utils/dateUtils';

export type HeatmapPeriod = 'weekly' | 'monthly' | 'overall';

export type DayComplianceStatus = 'taken' | 'partial' | 'skipped' | 'none';

export interface HeatmapDayEntry {
  date: string;               // ISO date: "YYYY-MM-DD"
  status: DayComplianceStatus;// 'taken' (All green), 'partial' (Orange), 'skipped' (Red), 'none' (Gray)
  totalCount: number;         // Total scheduled pills for the day
  takenCount: number;         // Number of pills actually taken
  adherenceRate: number;      // 0 - 100%
  dayName: string;            // "Mon", "Tue", etc.
  items: DailyLogItem[];      // Detailed pill records for popup/inspection
}

export interface HeatmapWeekColumn {
  weekIndex: number;
  days: HeatmapDayEntry[];
}

export interface HeatmapSummary {
  overallAdherence: number;   // Average adherence percentage (e.g. 92%)
  totalScheduledDoses: number;
  totalTakenDoses: number;
  perfectDaysCount: number;   // Days where 100% pills were taken
  currentStreak: number;      // Consecutive days of 100% compliance
}

export function useHeatmap(period: HeatmapPeriod = 'monthly') {
  const [data, setData] = useState<HeatmapDayEntry[]>([]);
  const [weeksMatrix, setWeeksMatrix] = useState<HeatmapWeekColumn[]>([]);
  const [summary, setSummary] = useState<HeatmapSummary>({
    overallAdherence: 100,
    totalScheduledDoses: 0,
    totalTakenDoses: 0,
    perfectDaysCount: 0,
    currentStreak: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHeatmapData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Determine number of weeks based on selected period
      // weekly: 1 week (7 days: Mon-Sun), monthly: 5 weeks (35 days), overall: 52 weeks (364 days)
      let numWeeks = 5;
      if (period === 'weekly') numWeeks = 1;
      if (period === 'overall') numWeeks = 52;

      // 2. Align start of grid strictly to Monday of the starting week (matching MedicationPunchCard)
      const today = new Date();
      const todayStr = formatToISODate(today);

      // Find Monday of current week (0 = Sun, 1 = Mon, ..., 6 = Sat)
      const currentDay = today.getDay();
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
      const currentMonday = new Date(today);
      currentMonday.setDate(today.getDate() - daysFromMonday);

      // Starting Monday for the earliest week in the matrix
      const startMonday = new Date(currentMonday);
      startMonday.setDate(currentMonday.getDate() - (numWeeks - 1) * 7);

      // 3. Fetch all intake records from SQLite
      const allLogs = await LogRepo.getAllLogs();

      // Index logs by date for O(1) lightning lookup
      const logsByDateMap = new Map<string, DailyLogItem[]>();
      for (const log of allLogs) {
        if (!logsByDateMap.has(log.date)) {
          logsByDateMap.set(log.date, []);
        }
        logsByDateMap.get(log.date)!.push(log);
      }

      // 4. Build 7-day columns matrix strictly mapped from Monday (index 0) to Sunday (index 6)
      let totalScheduled = 0;
      let totalTaken = 0;
      let perfectDays = 0;
      const allEntries: HeatmapDayEntry[] = [];
      const computedMatrix: HeatmapWeekColumn[] = [];

      for (let w = 0; w < numWeeks; w++) {
        const weekEntries: HeatmapDayEntry[] = [];

        for (let d = 0; d < 7; d++) {
          const cellDate = new Date(startMonday);
          cellDate.setDate(startMonday.getDate() + w * 7 + d);
          const dateStr = formatToISODate(cellDate);
          const isFuture = dateStr > todayStr;

          const dayLogs = logsByDateMap.get(dateStr) || [];
          const total = dayLogs.length;
          const taken = dayLogs.filter((l) => l.isTaken).length;

          let status: DayComplianceStatus = 'none';
          let rate = 0;

          if (!isFuture && total > 0) {
            totalScheduled += total;
            totalTaken += taken;
            rate = Math.round((taken / total) * 100);

            if (taken === total) {
              status = 'taken';
              perfectDays += 1;
            } else if (taken > 0) {
              status = 'partial';
            } else {
              status = 'skipped';
            }
          }

          const entry: HeatmapDayEntry = {
            date: dateStr,
            status,
            totalCount: total,
            takenCount: taken,
            adherenceRate: rate,
            dayName: getWeekdayName(dateStr),
            items: dayLogs,
          };

          weekEntries.push(entry);
          allEntries.push(entry);
        }

        computedMatrix.push({
          weekIndex: w,
          days: weekEntries,
        });
      }

      // 5. Calculate consecutive adherence streak (from today backwards)
      let currentStreak = 0;
      const pastOrTodayEntries = allEntries.filter((e) => e.date <= todayStr);
      for (let i = pastOrTodayEntries.length - 1; i >= 0; i--) {
        const entry = pastOrTodayEntries[i];
        if (entry.status === 'taken') {
          currentStreak += 1;
        } else if (entry.status === 'skipped' || entry.status === 'partial') {
          break;
        }
      }

      const overallAdherence =
        totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 100;

      setData(allEntries);
      setWeeksMatrix(computedMatrix);
      setSummary({
        overallAdherence,
        totalScheduledDoses: totalScheduled,
        totalTakenDoses: totalTaken,
        perfectDaysCount: perfectDays,
        currentStreak,
      });
    } catch (err) {
      console.error('Heatmap generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate adherence heatmap');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);

  return {
    heatmapData: data,
    weeksMatrix,
    summary,
    isLoading,
    error,
    refetch: fetchHeatmapData,
  };
}