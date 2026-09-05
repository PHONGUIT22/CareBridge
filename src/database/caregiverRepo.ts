import { getDatabase } from './db';

export interface CaregiverProfile {
  name: string;
  email: string;
}

export function parseCaregiverName(email?: string): string {
  if (!email || !email.trim()) return 'Family Caregiver';
  const prefix = email.split('@')[0].trim();
  if (!prefix) return 'Family Caregiver';

  // Format into readable title case (e.g., "david" -> "David", "david.smith" -> "David Smith")
  const words = prefix.replace(/[._-]+/g, ' ').split(' ').filter(Boolean);
  if (words.length === 0) return 'Family Caregiver';

  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// In-memory cache for synchronous instant access across screens
let cachedProfile: CaregiverProfile = {
  name: 'Family Caregiver',
  email: 'caregiver@carebridge.health',
};

type CaregiverListener = (profile: CaregiverProfile) => void;
const listeners: Set<CaregiverListener> = new Set();

export const CaregiverRepo = {
  /**
   * Synchronously return cached profile for zero-flicker UI render
   */
  getCaregiverSync(): CaregiverProfile {
    return cachedProfile;
  },

  /**
   * Load caregiver profile from SQLite
   */
  async getCaregiver(): Promise<CaregiverProfile> {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<{
        id: string;
        name: string;
        email: string;
      }>('SELECT * FROM caregiver_profile WHERE id = ?', ['primary']);

      if (row && row.name) {
        cachedProfile = {
          name: row.name,
          email: row.email || 'caregiver@carebridge.health',
        };
      }
    } catch (e) {
      // Safe fallback to default cache
    }
    return cachedProfile;
  },

  /**
   * Save caregiver credentials (from Email sign in or Guest login)
   */
  async saveCaregiver(email?: string, customName?: string): Promise<CaregiverProfile> {
    const formattedEmail = email && email.trim() ? email.trim() : 'guest.caregiver@carebridge.health';
    const computedName = customName && customName.trim()
      ? customName.trim()
      : parseCaregiverName(email);

    cachedProfile = {
      name: computedName,
      email: formattedEmail,
    };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO caregiver_profile (id, name, email, updated_at)
         VALUES ('primary', ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           email = excluded.email,
           updated_at = excluded.updated_at`,
        [computedName, formattedEmail, new Date().toISOString()]
      );
    } catch (e) {
      console.warn('Failed to persist caregiver profile to SQLite:', e);
    }

    // Notify all active listeners (e.g., Today screen)
    listeners.forEach((listener) => {
      try {
        listener(cachedProfile);
      } catch (err) {
        console.error('Error notifying caregiver listener:', err);
      }
    });

    return cachedProfile;
  },

  /**
   * Subscribe to caregiver profile changes
   */
  subscribe(listener: CaregiverListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
