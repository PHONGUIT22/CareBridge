import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LogRepo, DailyLogItem } from '../database/logRepo';

interface FullMonthCalendarModalProps {
  visible: boolean;
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const formatToISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const FullMonthCalendarModal: React.FC<FullMonthCalendarModalProps> = ({
  visible,
  currentDate,
  onSelectDate,
  onClose,
}) => {
  const [viewDate, setViewDate] = useState<Date>(new Date(currentDate));
  const [statusMap, setStatusMap] = useState<Record<string, { total: number; taken: number }>>({});

  // Reset viewDate when modal opens
  useEffect(() => {
    if (visible) {
      setViewDate(new Date(currentDate));
      loadMonthAdherence();
    }
  }, [visible, currentDate]);

  const loadMonthAdherence = useCallback(async () => {
    try {
      const allLogs: DailyLogItem[] = await LogRepo.getAllLogs();
      const map: Record<string, { total: number; taken: number }> = {};

      for (const log of allLogs) {
        if (!map[log.date]) {
          map[log.date] = { total: 0, taken: 0 };
        }
        map[log.date].total += 1;
        if (log.isTaken) {
          map[log.date].taken += 1;
        }
      }

      setStatusMap(map);
    } catch (err) {
      setStatusMap({});
    }
  }, []);

  const handlePrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, 12, 0, 0);
    onSelectDate(selected);
    onClose();
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setViewDate(new Date(today));
    onSelectDate(today);
    onClose();
  };

  // Calendar calculations
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // First day of month (0 = Sun, 1 = Mon ... 6 = Sat)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Monday start offset: Sun(0)->6, Mon(1)->0, Tue(2)->1...
  const startOffset = (firstDayIndex + 6) % 7;

  const realToday = new Date();
  const realTodayStr = formatToISODate(realToday);
  const selectedDateStr = formatToISODate(currentDate);

  const monthTitle = viewDate.toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });
  const monthTitleEn = viewDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCard}>
              {/* HEADER */}
              <View style={styles.header}>
                <View style={styles.monthNav}>
                  <TouchableOpacity
                    onPress={handlePrevMonth}
                    style={styles.navButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="chevron-left" size={24} color="#1E3A8A" />
                  </TouchableOpacity>

                  <View style={styles.monthTitleWrapper}>
                    <Text style={styles.monthTitleText}>{monthTitleEn}</Text>
                    <Text style={styles.monthSubtitleText}>{monthTitle}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleNextMonth}
                    style={styles.navButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="chevron-right" size={24} color="#1E3A8A" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="x" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* WEEKDAY LABELS */}
              <View style={styles.weekRow}>
                {WEEK_DAYS.map((wd, index) => (
                  <View key={index} style={styles.weekCell}>
                    <Text
                      style={[
                        styles.weekDayText,
                        index >= 5 && styles.weekendText,
                      ]}
                    >
                      {wd}
                    </Text>
                  </View>
                ))}
              </View>

              {/* DAYS GRID */}
              <View style={styles.daysGrid}>
                {/* Empty padding cells */}
                {Array.from({ length: startOffset }).map((_, idx) => (
                  <View key={`empty-${idx}`} style={styles.dayCell} />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = dateStr === selectedDateStr;
                  const isToday = dateStr === realTodayStr;
                  const isFuture = dateStr > realTodayStr;
                  const stats = statusMap[dateStr];

                  // Status dot determination
                  let dotColor: string | null = null;
                  if (stats && stats.total > 0) {
                    if (stats.taken === stats.total) {
                      dotColor = '#16A34A'; // 100% Taken (Green)
                    } else if (stats.taken > 0) {
                      dotColor = '#D97706'; // Partial (Amber/Orange)
                    } else {
                      dotColor = isFuture ? '#CBD5E1' : '#DC2626'; // Missed / Not taken (Red) or neutral future
                    }
                  } else if (!isFuture && dateStr < realTodayStr) {
                    // Past day with no logs recorded
                    dotColor = '#E2E8F0';
                  }

                  return (
                    <TouchableOpacity
                      key={`day-${day}`}
                      activeOpacity={0.7}
                      onPress={() => handleSelectDay(day)}
                      style={[
                        styles.dayCell,
                        styles.dayCellInteractive,
                        isSelected && styles.dayCellSelected,
                        isToday && !isSelected && styles.dayCellToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumberText,
                          isSelected && styles.dayNumberTextSelected,
                          isToday && !isSelected && styles.dayNumberTextToday,
                        ]}
                      >
                        {day}
                      </Text>

                      {/* Adherence Dot Indicator */}
                      <View style={styles.dotContainer}>
                        {dotColor ? (
                          <View
                            style={[
                              styles.adherenceDot,
                              { backgroundColor: dotColor },
                              isSelected && styles.adherenceDotSelected,
                            ]}
                          />
                        ) : (
                          <View style={styles.emptyDotPlaceholder} />
                        )}
                      </View>

                      {/* Today Badge */}
                      {isToday && (
                        <View style={styles.todayIndicator}>
                          <Text style={styles.todayIndicatorText}>Nay</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* STATUS LEGEND */}
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
                  <Text style={styles.legendText}>Đã uống đủ (100%)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
                  <Text style={styles.legendText}>Một phần</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
                  <Text style={styles.legendText}>Chưa uống / Bỏ lỡ</Text>
                </View>
              </View>

              {/* FOOTER ACTION: JUMP TO TODAY */}
              <TouchableOpacity
                style={styles.todayButton}
                activeOpacity={0.8}
                onPress={handleJumpToToday}
              >
                <Ionicons name="today-outline" size={18} color="#1E3A8A" />
                <Text style={styles.todayButtonText}>Về ngày hôm nay (Today)</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const { width } = Dimensions.get('window');
const CELL_SIZE = Math.floor((Math.min(width - 48, 380) - 24) / 7);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleWrapper: {
    paddingHorizontal: 6,
  },
  monthTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  monthSubtitleText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  weekCell: {
    width: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  weekendText: {
    color: '#EF4444',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE + 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 12,
    position: 'relative',
  },
  dayCellInteractive: {
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dayCellSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E3A8A',
  },
  dayCellToday: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  dayNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  dayNumberTextSelected: {
    color: '#1E3A8A',
    fontWeight: '800',
  },
  dayNumberTextToday: {
    color: '#B45309',
    fontWeight: '800',
  },
  dotContainer: {
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  adherenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  adherenceDotSelected: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  emptyDotPlaceholder: {
    width: 6,
    height: 6,
  },
  todayIndicator: {
    position: 'absolute',
    top: -2,
    right: 2,
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  todayIndicatorText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
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
    fontWeight: '600',
    color: '#64748B',
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
  },
});
