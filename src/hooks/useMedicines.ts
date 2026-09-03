import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { DailyLogItem, LogStatus, TimeGroup } from '../types';
import { LogRepo } from '../database/logRepo';
import { MedicineRepo } from '../database/medicineRepo';

function groupLogsByTime(items: DailyLogItem[]): TimeGroup[] {
  const groups: Record<string, DailyLogItem[]> = {};

  items.forEach((item) => {
    if (!groups[item.scheduledTime]) {
      groups[item.scheduledTime] = [];
    }
    groups[item.scheduledTime].push(item);
  });

  return Object.keys(groups)
    .sort((a, b) => a.localeCompare(b))
    .map((time) => ({
      time,
      items: groups[time],
    }));
}

export function useMedicines(selectedDate: Date) {
  const [logs, setLogs] = useState<DailyLogItem[]>([]);
  const [timeGroups, setTimeGroups] = useState<TimeGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const dateStr = selectedDate.toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await LogRepo.getLogsByDate(dateStr);
      setLogs(data);
      setTimeGroups(groupLogsByTime(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load medication logs');
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Optimistically updates state to instant green/pending before persisting to SQLite
   */
  const handleToggleTake = async (logId: string, currentStatus: LogStatus) => {
    const nextStatus: LogStatus = currentStatus === 'taken' ? 'pending' : 'taken';
    const isTaking = nextStatus === 'taken';
    const now = new Date();
    const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const nextTakenAt = nextStatus === 'taken' ? timeFormatted : undefined;

    // 1. Optimistic UI update
    setLogs((prevLogs) => {
      const updated = prevLogs.map((item) => {
        if (item.logId === logId) {
          const currentStock = item.stockCount ?? 30;
          const newStock = isTaking ? Math.max(0, currentStock - 1) : currentStock + 1;
          return {
            ...item,
            status: nextStatus,
            isTaken: nextStatus === 'taken',
            takenAt: nextTakenAt,
            stockCount: newStock,
          };
        }
        return item;
      });
      setTimeGroups(groupLogsByTime(updated));
      return updated;
    });

    // 2. Persist to database & update inventory stock
    try {
      await LogRepo.toggleLogStatus(logId, currentStatus);

      const targetItem = logs.find((item) => item.logId === logId);
      if (targetItem) {
        const delta = isTaking ? -1 : 1;
        const remainingStock = await MedicineRepo.updateStock(targetItem.medicineId, delta);

        // Sync exact stock count across all scheduled dose cards of this medicine
        setLogs((prevLogs) => {
          const updated = prevLogs.map((item) =>
            item.medicineId === targetItem.medicineId
              ? { ...item, stockCount: remainingStock }
              : item
          );
          setTimeGroups(groupLogsByTime(updated));
          return updated;
        });

        // Trigger low-stock warning when 5 or fewer pills remain
        if (isTaking && remainingStock <= 5) {
          Alert.alert(
            'Tủ thuốc sắp hết!',
            `Thuốc ${targetItem.name} chỉ còn ${remainingStock} viên. Hãy nạp lại tủ thuốc để duy trì đơn uống.`,
            [{ text: 'Đã hiểu' }]
          );
        }
      }
    } catch (err) {
      // Rollback on failure
      fetchData();
    }
  };

  return {
    logs,
    timeGroups,
    loading,
    error,
    refresh: fetchData,
    handleToggleTake,
  };
}