import { useState, useEffect, useCallback } from 'react';
import { LogRepo, DailyLogItem } from '../database/logRepo';
import { generateDateRange, getWeekdayName, chunkDatesIntoWeeks } from '../utils/dateUtils';

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
      // 1. Determine date span based on selected period
      // weekly: 7 days, monthly: 35 days (5 rolling weeks), overall: 364 days (52 rolling weeks)
      let daysCount = 35;
      if (period === 'weekly') daysCount = 7;
      if (period === 'overall') daysCount = 364;

      // 2. Generate sequential historical date range
      const rawDateRange = generateDateRange(daysCount);
      // Reverse so dates flow chronologically: past -> present (left to right)
      const chronologicalDates = [...rawDateRange].reverse();

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

      // 4. Map each calendar date into aggregated compliance status
      let totalScheduled = 0;
      let totalTaken = 0;
      let perfectDays = 0;

      const mappedEntries: HeatmapDayEntry[] = chronologicalDates.map((dateStr) => {
        const dayLogs = logsByDateMap.get(dateStr) || [];
        const total = dayLogs.length;
        const taken = dayLogs.filter((l) => l.isTaken).length;

        totalScheduled += total;
        totalTaken += taken;

        let status: DayComplianceStatus = 'none';
        let rate = 0;

        if (total > 0) {
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

        return {
          date: dateStr,
          status,
          totalCount: total,
          takenCount: taken,
          adherenceRate: rate,
          dayName: getWeekdayName(dateStr),
          items: dayLogs,
        };
      });

      // 5. Calculate consecutive adherence streak (from today backwards)
      let currentStreak = 0;
      for (let i = mappedEntries.length - 1; i >= 0; i--) {
        const entry = mappedEntries[i];
        if (entry.status === 'taken') {
          currentStreak += 1;
        } else if (entry.status === 'skipped' || entry.status === 'partial') {
          break;
        }
      }

      // 6. Build 7-day columns matrix for Contribution/Punch-card Grid
      const chunkedWeeks = chunkDatesIntoWeeks(chronologicalDates);
      const computedMatrix: HeatmapWeekColumn[] = chunkedWeeks.map((weekDates, idx) => {
        const weekEntries = weekDates.map((d) => {
          return (
            mappedEntries.find((e) => e.date === d) || {
              date: d,
              status: 'none' as DayComplianceStatus,
              totalCount: 0,
              takenCount: 0,
              adherenceRate: 0,
              dayName: getWeekdayName(d),
              items: [],
            }
          );
        });

        return {
          weekIndex: idx,
          days: weekEntries,
        };
      });

      const overallAdherence =
        totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 100;

      setData(mappedEntries);
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