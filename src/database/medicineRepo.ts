import { getDatabase } from './db';

export interface MedicineInput {
  id?: string;
  name: string;
  dosage: string;
  reminderTimes: string[]; // e.g. ["08:00", "12:00", "20:00"]
  daysOfWeek: string[];    // e.g. ["MON", "WED", "FRI"] or ["ALL"]
  imageUri?: string | null;
  stockCount?: number;
}

export interface MedicineRecord {
  id: string;
  name: string;
  dosage: string;
  reminderTimes: string[];
  daysOfWeek: string[];
  stockCount: number;
  imageUri?: string;
  createdAt: string;
}

export const MedicineRepo = {
  async addMedicine(input: MedicineInput): Promise<string> {
    const db = await getDatabase();
    const id = input.id || `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO medicines (id, name, dosage, reminder_times, days_of_week, image_uri, stock_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name.trim(),
        input.dosage.trim(),
        JSON.stringify(input.reminderTimes),
        JSON.stringify(input.daysOfWeek),
        input.imageUri || null,
        input.stockCount ?? 30,
        createdAt,
      ]
    );

    return id;
  },

  async updateMedicine(id: string, input: MedicineInput): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE medicines 
       SET name = ?, dosage = ?, reminder_times = ?, days_of_week = ?, image_uri = ? 
       WHERE id = ?`,
      [
        input.name.trim(),
        input.dosage.trim(),
        JSON.stringify(input.reminderTimes),
        JSON.stringify(input.daysOfWeek),
        input.imageUri || null,
        id,
      ]
    );
  },

  /**
   * Adjust pill stock by delta (-1 on take, +1 on un-take)
   */
  async updateStock(medicineId: string, delta: number): Promise<number> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE medicines 
       SET stock_count = MAX(0, COALESCE(stock_count, 30) + ?) 
       WHERE id = ?`,
      [delta, medicineId]
    );

    const row = await db.getFirstAsync<{ stock_count: number }>(
      'SELECT stock_count FROM medicines WHERE id = ?',
      [medicineId]
    );
    return row?.stock_count ?? 0;
  },

  /**
   * Refill medicine stock after sponsored ad completion
   */
  async refillMedicine(medicineId: string, refillAmount: number = 30): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE medicines 
       SET stock_count = COALESCE(stock_count, 0) + ? 
       WHERE id = ?`,
      [refillAmount, medicineId]
    );
  },

  async getAllMedicines(): Promise<MedicineRecord[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      name: string;
      dosage: string;
      reminder_times: string;
      days_of_week: string;
      image_uri: string | null;
      stock_count: number | null;
      created_at: string;
    }>('SELECT * FROM medicines ORDER BY created_at DESC');

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      dosage: row.dosage,
      reminderTimes: JSON.parse(row.reminder_times || '[]'),
      daysOfWeek: JSON.parse(row.days_of_week || '[]'),
      imageUri: row.image_uri || undefined,
      stockCount: row.stock_count ?? 30,
      createdAt: row.created_at,
    }));
  },

  /**
   * Permanently delete medicine and wipe its intake logs
   */
  async deleteMedicine(id: string): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM intake_logs WHERE medicine_id = ?', [id]);
      await db.runAsync('DELETE FROM medicines WHERE id = ?', [id]);
    });
  },
};