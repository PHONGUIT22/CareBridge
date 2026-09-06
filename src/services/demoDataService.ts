import { getDatabase } from '../database/db';
import { CaregiverRepo } from '../database/caregiverRepo';
import { formatToISODate } from '../utils/dateUtils';

export interface DemoSeedOptions {
  days?: number;
}

/**
 * Seeds rich, realistic 30-day clinical historical data into SQLite.
 * Designed for hackathon judges & evaluators logging in with demo credentials (demo@gmail.com / 1234).
 */
export async function seedDemoData(options?: DemoSeedOptions): Promise<void> {
  const days = options?.days ?? 30;
  const db = await getDatabase();
  const now = new Date();
  const thirtyDaysAgoIso = new Date(Date.now() - days * 86400000).toISOString();

  await db.withTransactionAsync(async () => {
    // 1. Clear existing dummy records to ensure pristine state
    await db.execAsync(`
      DELETE FROM intake_logs;
      DELETE FROM medicines;
      DELETE FROM daily_vitals;
    `);

    // 2. Seed 3 realistic medications created 30 days ago
    const medications = [
      {
        id: 'med_demo_amlodipine',
        name: 'Amlodipine (Blood Pressure)',
        dosage: '5 mg',
        reminder_times: JSON.stringify(['08:00']),
        days_of_week: JSON.stringify(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
        image_uri: null,
        stock_count: 60,
        type: 'tablet',
        created_at: thirtyDaysAgoIso,
      },
      {
        id: 'med_demo_metformin',
        name: 'Metformin (Blood Sugar)',
        dosage: '500 mg',
        reminder_times: JSON.stringify(['08:00', '20:00']),
        days_of_week: JSON.stringify(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
        image_uri: null,
        stock_count: 90,
        type: 'capsule',
        created_at: thirtyDaysAgoIso,
      },
      {
        id: 'med_demo_aspirin',
        name: 'Low-dose Aspirin',
        dosage: '81 mg',
        reminder_times: JSON.stringify(['12:00']),
        days_of_week: JSON.stringify(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
        image_uri: null,
        stock_count: 45,
        type: 'tablet',
        created_at: thirtyDaysAgoIso,
      },
    ];

    for (const med of medications) {
      await db.runAsync(
        `INSERT INTO medicines (id, name, dosage, reminder_times, days_of_week, image_uri, stock_count, type, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          med.id,
          med.name,
          med.dosage,
          med.reminder_times,
          med.days_of_week,
          med.image_uri,
          med.stock_count,
          med.type,
          med.created_at,
        ]
      );
    }

    // 3. Seed 30 days of intake history and biometric vitals
    for (let offset = days - 1; offset >= 0; offset--) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() - offset);
      const dateStr = formatToISODate(targetDate);
      const dayIndex = days - 1 - offset; // 0 (30 days ago) to 29 (today)

      // Biometric Vitals: Realistic physiological variance with natural fluctuations
      // Systolic BP: Natural variance around 118 - 124 mmHg
      const systolicNoise = ((dayIndex * 13) % 5) - 2;
      const systolic = 121 + Math.round(Math.sin(dayIndex * 0.25) * 3) + systolicNoise;

      // Diastolic BP: Natural variance around 78 - 82 mmHg
      const diastolicNoise = ((dayIndex * 7) % 3) - 1;
      const diastolic = 80 + Math.round(Math.cos(dayIndex * 0.25) * 2) + diastolicNoise;

      // Fasting Blood Sugar: 94 - 100 mg/dL with organic variations
      const sugarNoise = (((dayIndex * 17) % 7) - 3) * 0.4;
      const bloodSugar = Math.round((96 + Math.sin(dayIndex * 0.15) * 2 + sugarNoise) * 10) / 10;

      // Resting Heart Rate: 70 - 75 bpm
      const hrNoise = ((dayIndex * 11) % 3) - 1;
      const heartRate = 72 + Math.round(Math.cos(dayIndex * 0.2) * 3) + hrNoise;
      const vitalsUpdatedAt = `${dateStr}T08:30:00.000Z`;

      await db.runAsync(
        `INSERT INTO daily_vitals (date, systolic, diastolic, blood_sugar, heart_rate, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [dateStr, systolic, diastolic, bloodSugar, heartRate, vitalsUpdatedAt]
      );

      // Intake Logs for the 4 scheduled doses per day
      const scheduledDoses = [
        { medId: 'med_demo_amlodipine', time: '08:00' },
        { medId: 'med_demo_metformin', time: '08:00' },
        { medId: 'med_demo_aspirin', time: '12:00' },
        { medId: 'med_demo_metformin', time: '20:00' },
      ];

      for (const dose of scheduledDoses) {
        const logId = `log_${dateStr}_${dose.medId}_${dose.time.replace(':', '')}`;
        const logCreatedAt = `${dateStr}T${dose.time}:00.000Z`;

        if (offset === 0) {
          // TODAY: Morning 08:00 is taken, Midday 12:00 & Evening 20:00 are pending for live testing
          if (dose.time === '08:00') {
            const takenMinute = dose.medId === 'med_demo_amlodipine' ? '05' : '08';
            const note = dose.medId === 'med_demo_amlodipine' ? 'Taken with breakfast' : 'Taken with food';
            await db.runAsync(
              `INSERT INTO intake_logs (id, medicine_id, date, time, status, taken_at, notes, created_at)
               VALUES (?, ?, ?, ?, 'taken', ?, ?, ?)`,
              [logId, dose.medId, dateStr, dose.time, `08:${takenMinute}`, note, logCreatedAt]
            );
          } else {
            await db.runAsync(
              `INSERT INTO intake_logs (id, medicine_id, date, time, status, taken_at, notes, created_at)
               VALUES (?, ?, ?, ?, 'pending', NULL, NULL, ?)`,
              [logId, dose.medId, dateStr, dose.time, logCreatedAt]
            );
          }
        } else {
          // PAST DAYS: High adherence (~92% taken, ~8% skipped)
          const isSkipped =
            (offset === 4 && dose.medId === 'med_demo_metformin' && dose.time === '20:00') ||
            (offset === 7 && dose.medId === 'med_demo_aspirin' && dose.time === '12:00') ||
            (offset === 11 && dose.medId === 'med_demo_metformin' && dose.time === '08:00') ||
            (offset === 14 && dose.medId === 'med_demo_amlodipine' && dose.time === '08:00') ||
            (offset === 18 && dose.medId === 'med_demo_metformin' && dose.time === '20:00') ||
            (offset === 21 && dose.medId === 'med_demo_aspirin' && dose.time === '12:00') ||
            (offset === 25 && dose.medId === 'med_demo_metformin' && dose.time === '08:00') ||
            (offset === 27 && dose.medId === 'med_demo_amlodipine' && dose.time === '08:00');

          if (isSkipped) {
            await db.runAsync(
              `INSERT INTO intake_logs (id, medicine_id, date, time, status, taken_at, notes, created_at)
               VALUES (?, ?, ?, ?, 'skipped', NULL, 'Missed dose', ?)`,
              [logId, dose.medId, dateStr, dose.time, logCreatedAt]
            );
          } else {
            const [hourStr, minStr] = dose.time.split(':');
            const minuteVariation = (offset * 3 + (dose.time === '08:00' ? 4 : dose.time === '12:00' ? 8 : 12)) % 15;
            const takenMin = parseInt(minStr, 10) + minuteVariation;
            const takenAt = `${hourStr}:${takenMin.toString().padStart(2, '0')}`;
            const pastNote =
              offset % 5 === 0
                ? 'Taken with meal'
                : offset % 7 === 0
                ? 'Mild dizziness reported'
                : 'No adverse symptoms';

            await db.runAsync(
              `INSERT INTO intake_logs (id, medicine_id, date, time, status, taken_at, notes, created_at)
               VALUES (?, ?, ?, ?, 'taken', ?, ?, ?)`,
              [logId, dose.medId, dateStr, dose.time, takenAt, pastNote, logCreatedAt]
            );
          }
        }
      }
    }
  });

  // 4. Seed Caregiver Profile
  await CaregiverRepo.saveCaregiver('demo@gmail.com', 'Sarah Jenkins (Family Caregiver)');
}

export const DemoDataService = {
  seedDemoData,
};
