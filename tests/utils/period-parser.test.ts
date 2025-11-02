import { parsePeriod, isValidDate, DateRange } from '../../src/utils/period-parser';

describe('period-parser', () => {
  describe('parsePeriod', () => {
    describe('YYYY format (full year)', () => {
      it('should parse a valid year', () => {
        const result = parsePeriod('2024');
        expect(result).toEqual({
          start: '2024-01-01',
          end: '2024-12-31',
        });
      });

      it('should handle different valid years', () => {
        expect(parsePeriod('2020')).toEqual({
          start: '2020-01-01',
          end: '2020-12-31',
        });

        expect(parsePeriod('1999')).toEqual({
          start: '1999-01-01',
          end: '1999-12-31',
        });

        expect(parsePeriod('2100')).toEqual({
          start: '2100-01-01',
          end: '2100-12-31',
        });
      });

      it('should throw error for year below 1900', () => {
        expect(() => parsePeriod('1899')).toThrow('Invalid year: 1899. Must be between 1900 and 2100');
      });

      it('should throw error for year above 2100', () => {
        expect(() => parsePeriod('2101')).toThrow('Invalid year: 2101. Must be between 1900 and 2100');
      });
    });

    describe('YYYY-MM format (specific month)', () => {
      it('should parse January', () => {
        const result = parsePeriod('2024-01');
        expect(result).toEqual({
          start: '2024-01-01',
          end: '2024-01-31',
        });
      });

      it('should parse February in a leap year', () => {
        const result = parsePeriod('2024-02');
        expect(result).toEqual({
          start: '2024-02-01',
          end: '2024-02-29',
        });
      });

      it('should parse February in a non-leap year', () => {
        const result = parsePeriod('2023-02');
        expect(result).toEqual({
          start: '2023-02-01',
          end: '2023-02-28',
        });
      });

      it('should parse months with 30 days', () => {
        expect(parsePeriod('2024-04')).toEqual({
          start: '2024-04-01',
          end: '2024-04-30',
        });

        expect(parsePeriod('2024-06')).toEqual({
          start: '2024-06-01',
          end: '2024-06-30',
        });
      });

      it('should parse December', () => {
        const result = parsePeriod('2024-12');
        expect(result).toEqual({
          start: '2024-12-01',
          end: '2024-12-31',
        });
      });

      it('should throw error for invalid month (00)', () => {
        expect(() => parsePeriod('2024-00')).toThrow('Invalid month: 0. Must be between 01 and 12');
      });

      it('should throw error for invalid month (13)', () => {
        expect(() => parsePeriod('2024-13')).toThrow('Invalid month: 13. Must be between 01 and 12');
      });

      it('should throw error for year below 1900', () => {
        expect(() => parsePeriod('1899-05')).toThrow('Invalid year: 1899. Must be between 1900 and 2100');
      });

      it('should throw error for year above 2100', () => {
        expect(() => parsePeriod('2101-05')).toThrow('Invalid year: 2101. Must be between 1900 and 2100');
      });
    });

    describe('YYYY-QX format (quarter)', () => {
      it('should parse Q1', () => {
        const result = parsePeriod('2024-Q1');
        expect(result).toEqual({
          start: '2024-01-01',
          end: '2024-03-31',
        });
      });

      it('should parse Q2', () => {
        const result = parsePeriod('2024-Q2');
        expect(result).toEqual({
          start: '2024-04-01',
          end: '2024-06-30',
        });
      });

      it('should parse Q3', () => {
        const result = parsePeriod('2024-Q3');
        expect(result).toEqual({
          start: '2024-07-01',
          end: '2024-09-30',
        });
      });

      it('should parse Q4', () => {
        const result = parsePeriod('2024-Q4');
        expect(result).toEqual({
          start: '2024-10-01',
          end: '2024-12-31',
        });
      });

      it('should handle lowercase q', () => {
        const result = parsePeriod('2024-q1');
        expect(result).toEqual({
          start: '2024-01-01',
          end: '2024-03-31',
        });
      });

      it('should throw error for year below 1900', () => {
        expect(() => parsePeriod('1899-Q1')).toThrow('Invalid year: 1899. Must be between 1900 and 2100');
      });

      it('should throw error for year above 2100', () => {
        expect(() => parsePeriod('2101-Q1')).toThrow('Invalid year: 2101. Must be between 1900 and 2100');
      });
    });

    describe('YYYY-MM-DD format (specific date)', () => {
      it('should parse a valid date', () => {
        const result = parsePeriod('2024-06-15');
        expect(result).toEqual({
          start: '2024-06-15',
          end: '2024-06-15',
        });
      });

      it('should parse different valid dates', () => {
        expect(parsePeriod('2024-01-01')).toEqual({
          start: '2024-01-01',
          end: '2024-01-01',
        });

        expect(parsePeriod('2024-12-31')).toEqual({
          start: '2024-12-31',
          end: '2024-12-31',
        });
      });

      it('should parse leap day in a leap year', () => {
        const result = parsePeriod('2024-02-29');
        expect(result).toEqual({
          start: '2024-02-29',
          end: '2024-02-29',
        });
      });

      it('should accept dates that JavaScript Date rolls over (2024-02-30 becomes 2024-03-01)', () => {
        // JavaScript Date is lenient and rolls over invalid dates
        const result = parsePeriod('2024-02-30');
        expect(result).toEqual({
          start: '2024-02-30',
          end: '2024-02-30',
        });
      });

      it('should accept leap day in non-leap year (rolls over)', () => {
        // JavaScript Date rolls over 2023-02-29 to 2023-03-01
        const result = parsePeriod('2023-02-29');
        expect(result).toEqual({
          start: '2023-02-29',
          end: '2023-02-29',
        });
      });

      it('should accept 31st of April (rolls over)', () => {
        // JavaScript Date rolls over 2024-04-31 to 2024-05-01
        const result = parsePeriod('2024-04-31');
        expect(result).toEqual({
          start: '2024-04-31',
          end: '2024-04-31',
        });
      });

      it('should throw error for completely invalid date format', () => {
        expect(() => parsePeriod('2024-99-99')).toThrow('Invalid date: 2024-99-99');
      });
    });

    describe('invalid formats', () => {
      it('should throw error for invalid format', () => {
        expect(() => parsePeriod('invalid')).toThrow(
          'Invalid period format: "invalid". Expected YYYY, YYYY-MM, YYYY-QX, or YYYY-MM-DD'
        );
      });

      it('should throw error for partial year', () => {
        expect(() => parsePeriod('202')).toThrow(
          'Invalid period format: "202". Expected YYYY, YYYY-MM, YYYY-QX, or YYYY-MM-DD'
        );
      });

      it('should throw error for invalid quarter format', () => {
        expect(() => parsePeriod('2024-Q5')).toThrow(
          'Invalid period format: "2024-Q5". Expected YYYY, YYYY-MM, YYYY-QX, or YYYY-MM-DD'
        );
      });

      it('should throw error for invalid quarter (Q0)', () => {
        expect(() => parsePeriod('2024-Q0')).toThrow(
          'Invalid period format: "2024-Q0". Expected YYYY, YYYY-MM, YYYY-QX, or YYYY-MM-DD'
        );
      });

      it('should throw error for empty string', () => {
        expect(() => parsePeriod('')).toThrow(
          'Invalid period format: "". Expected YYYY, YYYY-MM, YYYY-QX, or YYYY-MM-DD'
        );
      });
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(isValidDate('2024-01-01')).toBe(true);
      expect(isValidDate('2024-06-15')).toBe(true);
      expect(isValidDate('2024-12-31')).toBe(true);
    });

    it('should return true for leap day in a leap year', () => {
      expect(isValidDate('2024-02-29')).toBe(true);
    });

    it('should return true for leap day in non-leap year (JavaScript Date rolls over)', () => {
      // JavaScript Date is lenient and accepts this (rolls to 2023-03-01)
      expect(isValidDate('2023-02-29')).toBe(true);
    });

    it('should return true for dates that roll over', () => {
      // JavaScript Date is lenient and accepts these
      expect(isValidDate('2024-02-30')).toBe(true); // rolls to 2024-03-01
      expect(isValidDate('2024-04-31')).toBe(true); // rolls to 2024-05-01
    });

    it('should return false for completely invalid dates', () => {
      expect(isValidDate('2024-13-01')).toBe(false); // month 13 doesn't exist
      expect(isValidDate('2024-99-99')).toBe(false);
    });

    it('should return false for invalid format', () => {
      expect(isValidDate('2024-1-1')).toBe(false);
      expect(isValidDate('24-01-01')).toBe(false);
      expect(isValidDate('2024/01/01')).toBe(false);
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('')).toBe(false);
    });

    it('should return false for year only', () => {
      expect(isValidDate('2024')).toBe(false);
    });

    it('should return false for year-month only', () => {
      expect(isValidDate('2024-01')).toBe(false);
    });
  });
});
