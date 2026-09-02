import { getDatabase } from './db';
import { MedicineRepo } from './medicineRepo';

export type LogStatus = 'pending' | 'taken' | 'skipped';

export interface DailyLogItem {
  logId: string;
  medicineId: string;
  name: string;
  dosage: string;
  scheduledTime: string; // e.g. "09:00"
  date: string;          // ISO date format: YYYY-MM-DD
  status: LogStatus;
  isTaken: boolean;
  takenAt?: string;      // e.g. "09:15"
}

const DAY_MAP: Record<number, string> = {
  0: 'SUN',
  1: 'MON',
  2: 'TUE',
  3: 'WED',
  4: 'THU',
  5: 'FRI',
  6: 'SAT',
};

export const LogRepo = {
  /**
   * Scan all medications and generate initial 'pending' intake records for a given date
   */
  async generateLogsForDate(dateStr: string): Promise<void> {
    const db = await getDatabase();
    const targetDate = new Date(dateStr);
    const dayCode = DAY_MAP[targetDate.getDay()];

    const allMeds = await MedicineRepo.getAllMedicines();
    if (allMeds.length === 0) return;

    await db.withTransactionAsync(async () => {
      for (const med of allMeds) {
        const isScheduledToday =
          med.daysOfWeek.includes('ALL') ||
          med.daysOfWeek.includes(dayCode);

        if (isScheduledToday) {
          for (const time of med.reminderTimes) {
            const logId = `log_${dateStr}_${med.id}_${time.replace(':', '')}`;
            const now = new Date().toISOString();

            await db.runAsync(
              `INSERT OR IGNORE INTO intake_logs (id, medicine_id, date, time, status, taken_at, created_at)
               VALUES (?, ?, ?, ?, 'pending', NULL, ?)`,
              [logId, med.id, dateStr, time, now]
            );
          }
        }
      }
    });
  },

  /**
   * Fetch intake logs joined with medication details for UI display (Calendar & Dashboard)
   */
  async getLogsByDate(dateStr: string): Promise<DailyLogItem[]> {
    const db = await getDatabase();

    await this.generateLogsForDate(dateStr);

    const query = `
      SELECT 
        l.id as logId,
        m.id as medicineId,
        m.name as name,
        m.dosage as dosage,
        l.time as scheduledTime,
        l.date as date,
        l.status as status,
        l.taken_at as takenAt
      FROM intake_logs l
      INNER JOIN medicines m ON l.medicine_id = m.id
      WHERE l.date = ?
      ORDER BY l.time ASC, m.name ASC
    `;

    const rows = await db.getAllAsync<{
      logId: string;
      medicineId: string;
      name: string;
      dosage: string;
      scheduledTime: string;
      date: string;
      status: LogStatus;
      takenAt: string | null;
    }>(query, [dateStr]);

    return rows.map((r) => ({
      logId: r.logId,
      medicineId: r.medicineId,
      name: r.name,
      dosage: r.dosage,
      scheduledTime: r.scheduledTime,
      date: r.date,
      status: r.status,
      isTaken: r.status === 'taken',
      takenAt: r.takenAt || undefined,
    }));
  },

  /**
   * Toggle intake status between 'taken' and 'pending'
   */
  async toggleLogStatus(logId: string, currentStatus: LogStatus): Promise<void> {
    const db = await getDatabase();

    if (currentStatus === 'taken') {
      await db.runAsync(
        `UPDATE intake_logs SET status = 'pending', taken_at = NULL WHERE id = ?`,
        [logId]
      );
    } else {
      const now = new Date();
      const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      await db.runAsync(
        `UPDATE intake_logs SET status = 'taken', taken_at = ? WHERE id = ?`,
        [timeFormatted, logId]
      );
    }
  },

  /**
   * Retrieve full intake history for exports and doctor reporting
   */
  async getAllLogs(): Promise<DailyLogItem[]> {
    const db = await getDatabase();
    const query = `
      SELECT 
        l.id as logId,
        m.id as medicineId,
        m.name as name,
        m.dosage as dosage,
        l.time as scheduledTime,
        l.date as date,
        l.status as status,
        l.taken_at as takenAt
      FROM intake_logs l
      INNER JOIN medicines m ON l.medicine_id = m.id
      ORDER BY l.date DESC, l.time ASC
    `;

    const rows = await db.getAllAsync<{
      logId: string;
      medicineId: string;
      name: string;
      dosage: string;
      scheduledTime: string;
      date: string;
      status: LogStatus;
      takenAt: string | null;
    }>(query);

    return rows.map((r) => ({
      logId: r.logId,
      medicineId: r.medicineId,
      name: r.name,
      dosage: r.dosage,
      scheduledTime: r.scheduledTime,
      date: r.date,
      status: r.status,
      isTaken: r.status === 'taken',
      takenAt: r.takenAt || undefined,
    }));
  },
};