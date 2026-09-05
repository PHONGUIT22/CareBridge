export type DayCode = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'ALL';

export type LogStatus = 'pending' | 'taken' | 'skipped';

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  reminderTimes: string[]; // e.g. ["09:00", "12:00", "20:00"]
  daysOfWeek: DayCode[];   // e.g. ["MON", "WED", "FRI"] or ["ALL"]
  createdAt: string;
  imageUri?: string;
  stockCount?: number;
  type?: 'medication' | 'routine';
}

export interface IntakeLog {
  id: string;
  medicineId: string;
  date: string;            // Format: YYYY-MM-DD
  time: string;            // Scheduled time slot: HH:mm
  status: LogStatus;
  takenAt?: string;        // Actual taken time: HH:mm
  createdAt: string;
}

export interface DailyLogItem {
  logId: string;
  medicineId: string;
  name: string;
  dosage: string;
  scheduledTime: string;   // e.g. "09:00"
  date: string;            // Format: YYYY-MM-DD
  status: LogStatus;
  isTaken: boolean;
  takenAt?: string;
  imageUri?: string;
  stockCount?: number;
  type?: 'medication' | 'routine';
}

export interface TimeGroup {
  time: string;            // e.g. "09:00"
  items: DailyLogItem[];
}

export type AppTab = 'overview' | 'desk' | 'medication' | 'history';