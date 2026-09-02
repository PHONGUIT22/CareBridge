import { getDatabase } from './db';

export interface MedicineInput {
  id?: string;
  name: string;
  dosage: string;
  reminderTimes: string[]; // e.g. ["08:00", "12:00", "20:00"]
  daysOfWeek: string[];    // e.g. ["MON", "WED", "FRI"] or ["ALL"]
}

export interface MedicineRecord {
  id: string;
  name: string;
  dosage: string;
  reminderTimes: string[];
  daysOfWeek: string[];
  createdAt: string;
}

export const MedicineRepo = {
  /**
   * Persist a new medication schedule into SQLite
   */
  async addMedicine(input: MedicineInput): Promise<string> {
    const db = await getDatabase();
    const id = input.id || `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO medicines (id, name, dosage, reminder_times, days_of_week, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name.trim(),
        input.dosage.trim(),
        JSON.stringify(input.reminderTimes),
        JSON.stringify(input.daysOfWeek),
        createdAt,
      ]
    );

    return id;
  },

  /**
   * Update an existing medication schedule
   */
  async updateMedicine(id: string, input: MedicineInput): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE medicines 
       SET name = ?, dosage = ?, reminder_times = ?, days_of_week = ? 
       WHERE id = ?`,
      [
        input.name.trim(),
        input.dosage.trim(),
        JSON.stringify(input.reminderTimes),
        JSON.stringify(input.daysOfWeek),
        id,
      ]
    );
  },

  /**
   * Retrieve all saved medications
   */
  async getAllMedicines(): Promise<MedicineRecord[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      name: string;
      dosage: string;
      reminder_times: string;
      days_of_week: string;
      created_at: string;
    }>('SELECT * FROM medicines ORDER BY created_at DESC');

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      dosage: row.dosage,
      reminderTimes: JSON.parse(row.reminder_times || '[]'),
      daysOfWeek: JSON.parse(row.days_of_week || '[]'),
      createdAt: row.created_at,
    }));
  },

  /**
   * Delete medication and automatically cascade delete related intake logs
   */
  async deleteMedicine(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM medicines WHERE id = ?', [id]);
  },
};