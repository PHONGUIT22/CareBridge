export interface DateInfo {
  date: string;         // "YYYY-MM-DD"
  weekday: number;      // 1–7 (1 = Monday, 7 = Sunday)
  isoTimestamp: string; // ISO 8601 string
  weekStart: string;    // Monday of current week "YYYY-MM-DD"
  weekEnd: string;      // Sunday of current week "YYYY-MM-DD"
  monthStart: string;   // 1st day of month "YYYY-MM-DD"
  monthEnd: string;     // Last day of month "YYYY-MM-DD"
  yearStart: string;    // Jan 01 "YYYY-MM-DD"
  yearEnd: string;      // Dec 31 "YYYY-MM-DD"
}

/**
 * Format any Date instance to standard ISO format "YYYY-MM-DD"
 */
export function formatToISODate(d: Date): string {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get comprehensive date metadata for the given or current date
 */
export function getDateInfo(baseDate: Date = new Date()): DateInfo {
  const now = new Date(baseDate);
  const date = formatToISODate(now);

  // Convert JS Sunday(0) -> 7, Monday(1) -> 1, ..., Saturday(6) -> 6
  const jsDay = now.getDay();
  const weekday = jsDay === 0 ? 7 : jsDay;

  // Calculate Monday as Week Start, Sunday as Week End
  const daysFromMonday = weekday - 1;
  const startOfWeekDate = new Date(now);
  startOfWeekDate.setDate(now.getDate() - daysFromMonday);
  const weekStart = formatToISODate(startOfWeekDate);

  const endOfWeekDate = new Date(startOfWeekDate);
  endOfWeekDate.setDate(startOfWeekDate.getDate() + 6);
  const weekEnd = formatToISODate(endOfWeekDate);

  // Month Start & End
  const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStart = formatToISODate(startOfMonthDate);

  const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthEnd = formatToISODate(endOfMonthDate);

  // Year Start & End
  const yearStart = `${now.getFullYear()}-01-01`;
  const yearEnd = `${now.getFullYear()}-12-31`;

  return {
    date,
    weekday,
    isoTimestamp: now.toISOString(),
    weekStart,
    weekEnd,
    monthStart,
    monthEnd,
    yearStart,
    yearEnd,
  };
}

/**
 * Check if a date string ("YYYY-MM-DD") is today or in the past
 */
export function isDatePastOrToday(dateStr: string): boolean {
  const today = formatToISODate(new Date());
  return dateStr <= today;
}

/**
 * Get weekday short name (e.g. "Mon", "Tue", "Wed")
 */
export function getWeekdayName(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Get 7 date strings (Monday to Sunday) for the active week
 */
export function getWeekDates(referenceDateStr?: string): string[] {
  const base = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const info = getDateInfo(base);
  const dates: string[] = [];
  const start = new Date(info.weekStart);

  for (let i = 0; i < 7; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    dates.push(formatToISODate(current));
  }
  return dates;
}

/**
 * Generates an array of historical dates going backwards from today
 * @param days - Number of days to generate (e.g. 90 for 3 months, 365 for 1 year)
 * @returns Array of date strings in reverse chronological order ["2026-09-02", "2026-09-01", ...]
 */
export function generateDateRange(days: number, fromDate: Date = new Date()): string[] {
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(fromDate);
    d.setDate(fromDate.getDate() - i);
    dates.push(formatToISODate(d));
  }
  return dates;
}

/**
 * Splits a list of dates into 7-day chunks (columns) for punch-card grids & calendar matrices
 * @param dates - Array of date strings
 * @returns Array of 7-element date arrays
 */
export function chunkDatesIntoWeeks(dates: string[]): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < dates.length; i += 7) {
    chunks.push(dates.slice(i, i + 7));
  }
  return chunks;
}