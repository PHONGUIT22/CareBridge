import { getDatabase } from './db';

export interface VitalsRecord {
  date: string; // YYYY-MM-DD
  systolic?: number | null; // Systolic blood pressure (e.g. 120)
  diastolic?: number | null; // Diastolic blood pressure (e.g. 80)
  bloodSugar?: number | null; // Blood sugar level (mg/dL)
  heartRate?: number | null; // Heart rate (bpm)
  updatedAt: string;
}

export const VitalsRepo = {
  async getVitalsByDate(dateStr: string): Promise<VitalsRecord | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{
      date: string;
      systolic: number | null;
      diastolic: number | null;
      blood_sugar: number | null;
      heart_rate: number | null;
      updated_at: string;
    }>('SELECT * FROM daily_vitals WHERE date = ?', [dateStr]);

    if (!row) return null;
    return {
      date: row.date,
      systolic: row.systolic,
      diastolic: row.diastolic,
      bloodSugar: row.blood_sugar,
      heartRate: row.heart_rate,
      updatedAt: row.updated_at,
    };
  },

  async saveVitals(vitals: VitalsRecord): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO daily_vitals (date, systolic, diastolic, blood_sugar, heart_rate, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         systolic = excluded.systolic,
         diastolic = excluded.diastolic,
         blood_sugar = excluded.blood_sugar,
         heart_rate = excluded.heart_rate,
         updated_at = excluded.updated_at`,
      [
        vitals.date,
        vitals.systolic ?? null,
        vitals.diastolic ?? null,
        vitals.bloodSugar ?? null,
        vitals.heartRate ?? null,
        new Date().toISOString(),
      ]
    );
  },

  async getAllVitals(): Promise<VitalsRecord[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      date: string;
      systolic: number | null;
      diastolic: number | null;
      blood_sugar: number | null;
      heart_rate: number | null;
      updated_at: string;
    }>('SELECT * FROM daily_vitals ORDER BY date DESC');

    return rows.map((row) => ({
      date: row.date,
      systolic: row.systolic,
      diastolic: row.diastolic,
      bloodSugar: row.blood_sugar,
      heartRate: row.heart_rate,
      updatedAt: row.updated_at,
    }));
  },
};
