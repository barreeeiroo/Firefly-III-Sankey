/**
 * Period Parser Utility
 * Converts period strings into date ranges
 */

export interface DateRange {
  start: string;
  end: string;
}

/**
 * Parse a period string into start and end dates
 * Supports: YYYY, YYYY-MM, YYYY-QX, YYYY-MM-DD
 */
export function parsePeriod(period: string): DateRange {
  // YYYY format (full year)
  if (/^\d{4}$/.test(period)) {
    return parseYear(period);
  }

  // YYYY-MM format (specific month)
  if (/^\d{4}-\d{2}$/.test(period)) {
    return parseMonth(period);
  }

  // YYYY-QX format (quarter)
  if (/^\d{4}-Q[1-4]$/i.test(period)) {
    return parseQuarter(period);
  }

  // YYYY-MM-DD format (specific date - single day)
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    return parseSingleDay(period);
  }

  throw new Error(
    `Invalid period format: "${period}". Expected YYYY, YYYY-MM, YYYY-QX, or YYYY-MM-DD`
  );
}

/**
 * Parse full year (YYYY)
 */
function parseYear(period: string): DateRange {
  const year = parseInt(period, 10);

  if (year < 1900 || year > 2100) {
    throw new Error(`Invalid year: ${year}. Must be between 1900 and 2100`);
  }

  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };
}

/**
 * Parse month (YYYY-MM)
 */
function parseMonth(period: string): DateRange {
  const [yearStr, monthStr] = period.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (year < 1900 || year > 2100) {
    throw new Error(`Invalid year: ${year}. Must be between 1900 and 2100`);
  }

  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Must be between 01 and 12`);
  }

  // Get last day of month
  const lastDay = new Date(year, month, 0).getDate();

  return {
    start: `${year}-${monthStr}-01`,
    end: `${year}-${monthStr}-${lastDay.toString().padStart(2, '0')}`,
  };
}

/**
 * Parse quarter (YYYY-QX)
 */
function parseQuarter(period: string): DateRange {
  const match = period.match(/^(\d{4})-Q([1-4])$/i);
  if (!match) {
    throw new Error(`Invalid quarter format: ${period}`);
  }

  const year = parseInt(match[1], 10);
  const quarter = parseInt(match[2], 10);

  if (year < 1900 || year > 2100) {
    throw new Error(`Invalid year: ${year}. Must be between 1900 and 2100`);
  }

  const quarters: { [key: number]: { start: string; end: string } } = {
    1: { start: '01-01', end: '03-31' },
    2: { start: '04-01', end: '06-30' },
    3: { start: '07-01', end: '09-30' },
    4: { start: '10-01', end: '12-31' },
  };

  const q = quarters[quarter];

  return {
    start: `${year}-${q.start}`,
    end: `${year}-${q.end}`,
  };
}

/**
 * Parse single day (YYYY-MM-DD)
 */
function parseSingleDay(period: string): DateRange {
  // Validate the date is valid
  const date = new Date(period);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${period}`);
  }

  return {
    start: period,
    end: period,
  };
}

/**
 * Validate that a date string is in YYYY-MM-DD format and is valid
 */
export function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}
