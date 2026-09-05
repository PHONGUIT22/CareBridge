import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function initDB(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await SQLite.openDatabaseAsync('carebridge.db');

  // Enable WAL mode for high-concurrency writes and enforce foreign key constraints
  await dbInstance.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      reminder_times TEXT NOT NULL,
      days_of_week TEXT NOT NULL,
      image_uri TEXT,
      stock_count INTEGER DEFAULT 30,
      type TEXT DEFAULT 'medication',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS intake_logs (
      id TEXT PRIMARY KEY NOT NULL,
      medicine_id TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'taken', 'skipped')),
      taken_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daily_vitals (
      date TEXT PRIMARY KEY NOT NULL,
      systolic INTEGER,
      diastolic INTEGER,
      blood_sugar REAL,
      heart_rate INTEGER,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS caregiver_profile (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_log_unique ON intake_logs(medicine_id, date, time);
    CREATE INDEX IF NOT EXISTS idx_log_date ON intake_logs(date);
  `);

  // Automatically add column if existing database does not have image_uri yet
  try {
    await dbInstance.execAsync(`ALTER TABLE medicines ADD COLUMN image_uri TEXT;`);
  } catch (e) {
    // Column already exists, safe to ignore
  }

  // Automatically add column if existing database does not have stock_count yet
  try {
    await dbInstance.execAsync(`ALTER TABLE medicines ADD COLUMN stock_count INTEGER DEFAULT 30;`);
  } catch (e) {
    // Column already exists, safe to ignore
  }

  // Automatic migration if existing database does not have type column yet
  try {
    await dbInstance.execAsync(`ALTER TABLE medicines ADD COLUMN type TEXT DEFAULT 'medication';`);
  } catch (e) {
    // Column already exists, safe to ignore
  }

  return dbInstance;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    return await initDB();
  }
  return dbInstance;
}