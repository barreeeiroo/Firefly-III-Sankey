import { formatSankeyMatic, generateSankeyMaticUrl } from '../../../src/sankey/formatters';
import { SankeyDiagram } from '../../../src/sankey/entities';
import * as LZString from 'lz-string';

describe('formatSankeyMatic', () => {
  const mockDiagram: SankeyDiagram = {
    nodes: [
      { id: 0, name: 'Salary', type: 'revenue' },
      { id: 1, name: 'Income Category', type: 'category' },
      { id: 2, name: 'All Funds', type: 'asset' },
      { id: 3, name: 'Monthly Budget', type: 'budget' },
      { id: 4, name: 'Expense Category', type: 'category' },
      { id: 5, name: 'Supermarket', type: 'expense' },
    ],
    links: [
      { source: 0, target: 1, value: 3000.0, currency: 'USD' },
      { source: 1, target: 2, value: 3000.0, currency: 'USD' },
      { source: 2, target: 3, value: 1000.0, currency: 'USD' },
      { source: 3, target: 4, value: 1000.0, currency: 'USD' },
      { source: 4, target: 5, value: 1000.0, currency: 'USD' },
    ],
    metadata: {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      generatedAt: '2024-01-31T12:00:00.000Z',
      currency: 'USD',
    },
  };

  const emptyDiagram: SankeyDiagram = {
    nodes: [],
    links: [],
    metadata: {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      generatedAt: '2024-01-31T12:00:00.000Z',
      currency: 'EUR',
    },
  };

  it('should include header comments', () => {
    const result = formatSankeyMatic(mockDiagram);

    expect(result).toContain('// Firefly III Sankey Diagram');
    expect(result).toContain('// Period: 2024-01-01 to 2024-01-31');
    expect(result).toContain('// Currency: USD');
    expect(result).toContain('// Paste this into https://sankeymatic.com/build/');
  });

  it('should include generation timestamp in comments', () => {
    const result = formatSankeyMatic(mockDiagram);
    expect(result).toContain('// Generated:');
  });

  it('should format flows in SankeyMatic syntax', () => {
    const result = formatSankeyMatic(mockDiagram);

    // Check for SankeyMatic format: Source [Amount] Target
    expect(result).toContain('Salary [3000.00] Income Category');
    expect(result).toContain('Income Category [3000.00] All Funds');
    expect(result).toContain('All Funds [1000.00] Monthly Budget');
    expect(result).toContain('Monthly Budget [1000.00] Expense Category');
    expect(result).toContain('Expense Category [1000.00] Supermarket');
  });

  it('should organize flows into sections', () => {
    const result = formatSankeyMatic(mockDiagram);

    expect(result).toContain('// Income Accounts -> Income Categories');
    expect(result).toContain('// Income -> Assets');
    expect(result).toContain('// Assets -> Budgets');
    expect(result).toContain('// Budgets -> Expense Categories');
    expect(result).toContain('// Expense Categories -> Expense Accounts');
  });

  it('should handle revenue to category flows', () => {
    const diagram: SankeyDiagram = {
      nodes: [
        { id: 0, name: 'Job', type: 'revenue' },
        { id: 1, name: 'Wages', type: 'category' },
      ],
      links: [
        { source: 0, target: 1, value: 5000, currency: 'USD' },
      ],
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        generatedAt: '2024-01-31T12:00:00.000Z',
        currency: 'USD',
      },
    };

    const result = formatSankeyMatic(diagram);
    expect(result).toContain('// Income Accounts -> Income Categories');
    expect(result).toContain('Job [5000.00] Wages');
  });

  it('should handle category to All Funds flows', () => {
    const diagram: SankeyDiagram = {
      nodes: [
        { id: 0, name: 'Income Cat', type: 'category' },
        { id: 1, name: 'All Funds', type: 'asset' },
      ],
      links: [
        { source: 0, target: 1, value: 2000, currency: 'USD' },
      ],
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        generatedAt: '2024-01-31T12:00:00.000Z',
        currency: 'USD',
      },
    };

    const result = formatSankeyMatic(diagram);
    expect(result).toContain('// Income -> Assets');
    expect(result).toContain('Income Cat [2000.00] All Funds');
  });

  it('should handle direct revenue to All Funds flows', () => {
    const diagram: SankeyDiagram = {
      nodes: [
        { id: 0, name: 'Salary', type: 'revenue' },
        { id: 1, name: 'All Funds', type: 'asset' },
      ],
      links: [
        { source: 0, target: 1, value: 4000, currency: 'USD' },
      ],
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        generatedAt: '2024-01-31T12:00:00.000Z',
        currency: 'USD',
      },
    };

    const result = formatSankeyMatic(diagram);
    expect(result).toContain('// Income -> Assets');
    expect(result).toContain('Salary [4000.00] All Funds');
  });

  it('should handle All Funds to budget flows', () => {
    const diagram: SankeyDiagram = {
      nodes: [
        { id: 0, name: 'All Funds', type: 'asset' },
        { id: 1, name: 'Groceries Budget', type: 'budget' },
      ],
      links: [
        { source: 0, target: 1, value: 500, currency: 'USD' },
      ],
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        generatedAt: '2024-01-31T12:00:00.000Z',
        currency: 'USD',
      },
    };

    const result = formatSankeyMatic(diagram);
    expect(result).toContain('// Assets -> Budgets');
    expect(result).toContain('All Funds [500.00] Groceries Budget');
  });

  it('should handle budget to category flows', () => {
    const diagram: SankeyDiagram = {
      nodes: [
        { id: 0, name: 'Food Budget', type: 'budget' },
        { id: 1, name: 'Restaurants', type: 'category' },
      ],
      links: [
        { source: 0, target: 1, value: 200, currency: 'USD' },
      ],
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        generatedAt: '2024-01-31T12:00:00.000Z',
        currency: 'USD',
      },
    };

    const result = formatSankeyMatic(diagram);
    expect(result).toContain('// Budgets -> Expense Categories');
    expect(result).toContain('Food Budget [200.00] Restaurants');
  });

  it('should handle budget to expense flows (no category)', () => {
    const diagram: SankeyDiagram = {
      nodes: [
        { id: 0, name: 'Bills Budget', type: 'budget' },
        { id: 1, name: 'Electric Company', type: 'expense' },
      ],
      links: [
        { source: 0, target: 1, value: 150, currency: 'USD' },
      ],
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        generatedAt: '2024-01-31T12:00:00.000Z',
        currency: 'USD',
      },
    };

    const result = formatSankeyMatic(diagram);
    expect(result).toContain('// Budgets -> Expense Accounts (no category)');
    expect(result).toContain('Bills Budget [150.00] Electric Company');
  });

  it('should handle category to expense flows', () => {
    const diagram: SankeyDiagram = {
      nodes: [
        { id: 0, name: 'Food', type: 'category' },
        { id: 1, name: 'Store', type: 'expense' },
      ],
      links: [
        { source: 0, target: 1, value: 75, currency: 'USD' },
      ],
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        generatedAt: '2024-01-31T12:00:00.000Z',
        currency: 'USD',
      },
    };

    const result = formatSankeyMatic(diagram);
    expect(result).toContain('// Expense Categories -> Expense Accounts');
    expect(result).toContain('Food [75.00] Store');
  });

  it('should handle All Funds to expense flows (no budget or category)', () => {
    const diagram: SankeyDiagram = {
      nodes: [
        { id: 0, name: 'All Funds', type: 'asset' },
        { id: 1, name: 'Cash Expense', type: 'expense' },
      ],
      links: [
        { source: 0, target: 1, value: 50, currency: 'USD' },
      ],
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        generatedAt: '2024-01-31T12:00:00.000Z',
        currency: 'USD',
      },
    };

    const result = formatSankeyMatic(diagram);
    expect(result).toContain('// Assets -> Expense Accounts (no budget or category)');
    expect(result).toContain('All Funds [50.00] Cash Expense');
  });

  it('should handle asset account flows with transfers', () => {
    const diagram: SankeyDiagram = {
      nodes: [
        { id: 0, name: 'Checking (+)', type: 'asset' },
        { id: 1, name: 'Savings (-)', type: 'asset' },
      ],
      links: [
        { source: 0, target: 1, value: 1000, currency: 'USD' },
      ],
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        generatedAt: '2024-01-31T12:00:00.000Z',
        currency: 'USD',
      },
    };

    const result = formatSankeyMatic(diagram);
    expect(result).toContain('// Other Flows (Transfers, etc.)');
    expect(result).toContain('Checking (+) [1000.00] Savings (-)');
  });

  it('should handle asset to category flows', () => {
    const diagram: SankeyDiagram = {
      nodes: [
        { id: 0, name: 'Checking (-)', type: 'asset' },
        { id: 1, name: 'Food', type: 'category' },
      ],
      links: [
        { source: 0, target: 1, value: 300, currency: 'USD' },
      ],
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        generatedAt: '2024-01-31T12:00:00.000Z',
        currency: 'USD',
      },
    };

    const result = formatSankeyMatic(diagram);
    expect(result).toContain('// Assets -> Expense Categories (no budget)');
    expect(result).toContain('Checking (-) [300.00] Food');
  });

  it('should handle category to asset flows', () => {
    const diagram: SankeyDiagram = {
      nodes: [
        { id: 0, name: 'Salary Category', type: 'category' },
        { id: 1, name: 'Checking (+)', type: 'asset' },
      ],
      links: [
        { source: 0, target: 1, value: 5000, currency: 'USD' },
      ],
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        generatedAt: '2024-01-31T12:00:00.000Z',
        currency: 'USD',
      },
    };

    const result = formatSankeyMatic(diagram);
    expect(result).toContain('// Income -> Assets');
    expect(result).toContain('Salary Category [5000.00] Checking (+)');
  });

  it('should handle empty diagram', () => {
    const result = formatSankeyMatic(emptyDiagram);

    expect(result).toContain('// Firefly III Sankey Diagram');
    expect(result).toContain('// Currency: EUR');
    expect(result).not.toContain('// Income Accounts');
    expect(result).not.toContain('// Assets -> Budgets');
  });

  it('should format decimal amounts with 2 decimal places', () => {
    const diagram: SankeyDiagram = {
      nodes: [
        { id: 0, name: 'Source', type: 'revenue' },
        { id: 1, name: 'Target', type: 'category' },
      ],
      links: [
        { source: 0, target: 1, value: 123.456789, currency: 'EUR' },
      ],
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        generatedAt: '2024-01-31T12:00:00.000Z',
        currency: 'EUR',
      },
    };

    const result = formatSankeyMatic(diagram);
    expect(result).toContain('[123.46]');
  });

  it('should skip flows with missing nodes', () => {
    const diagram: SankeyDiagram = {
      nodes: [
        { id: 0, name: 'Existing Node', type: 'revenue' },
      ],
      links: [
        { source: 0, target: 999, value: 100, currency: 'USD' }, // Target doesn't exist
        { source: 888, target: 0, value: 200, currency: 'USD' }, // Source doesn't exist
      ],
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        generatedAt: '2024-01-31T12:00:00.000Z',
        currency: 'USD',
      },
    };

    const result = formatSankeyMatic(diagram);
    // Should not throw, and should not contain these flows
    expect(result).not.toContain('undefined');
    expect(result).not.toContain('[100.00]');
    expect(result).not.toContain('[200.00]');
  });

  describe('URL generation', () => {
    it('should include URL by default', () => {
      const result = formatSankeyMatic(mockDiagram);

      expect(result).toContain('// 🔗 Direct Link (click to open in SankeyMatic):');
      expect(result).toContain('https://sankeymatic.com/build/?i=');
    });

    it('should not include URL when includeUrl is false', () => {
      const result = formatSankeyMatic(mockDiagram, { includeUrl: false });

      expect(result).not.toContain('// 🔗 Direct Link');
      expect(result).not.toContain('https://sankeymatic.com/build/?i=');
    });

    it('should generate URL with valid compressed data', () => {
      const result = formatSankeyMatic(mockDiagram);
      const urlMatch = result.match(/https:\/\/sankeymatic\.com\/build\/\?i=([^\s\n]+)/);

      expect(urlMatch).toBeTruthy();
      if (urlMatch) {
        const compressedData = urlMatch[1];
        // Verify data can be decompressed
        const decompressed = LZString.decompressFromEncodedURIComponent(compressedData);
        expect(decompressed).toBeTruthy();
        expect(typeof decompressed).toBe('string');
      }
    });

    it('should generate URL without comment lines', () => {
      const result = formatSankeyMatic(mockDiagram);
      const urlMatch = result.match(/https:\/\/sankeymatic\.com\/build\/\?i=([^\s\n]+)/);

      expect(urlMatch).toBeTruthy();
      if (urlMatch) {
        const compressedData = urlMatch[1];
        const decompressed = LZString.decompressFromEncodedURIComponent(compressedData);

        // Decompressed data should not contain comment lines
        expect(decompressed).not.toContain('// Firefly III');
        expect(decompressed).not.toContain('// Period:');
        expect(decompressed).not.toContain('// Income Accounts');

        // But should contain flow data
        expect(decompressed).toContain('[3000.00]');
        expect(decompressed).toContain('[1000.00]');
      }
    });

    it('should use custom base URL when provided', () => {
      const customBaseUrl = 'https://my-sankeymatic.example.com';
      const result = formatSankeyMatic(mockDiagram, { baseUrl: customBaseUrl });

      expect(result).toContain('// 🔗 Direct Link (click to open in SankeyMatic):');
      expect(result).toContain('https://my-sankeymatic.example.com/build/?i=');
      expect(result).not.toContain('https://sankeymatic.com/build');
    });

    it('should use custom base URL with includeUrl option', () => {
      const customBaseUrl = 'https://custom.example.com';
      const result = formatSankeyMatic(mockDiagram, { includeUrl: true, baseUrl: customBaseUrl });

      expect(result).toContain('https://custom.example.com/build/?i=');
      expect(result).not.toContain('sankeymatic.com');
    });

    it('should not include URL when includeUrl is false even with custom base URL', () => {
      const customBaseUrl = 'https://custom.example.com';
      const result = formatSankeyMatic(mockDiagram, { includeUrl: false, baseUrl: customBaseUrl });

      expect(result).not.toContain('// 🔗 Direct Link');
      expect(result).not.toContain('/build/?i=');
      // Should still contain the paste instruction with custom URL
      expect(result).toContain('// Paste this into https://custom.example.com/build/');
    });
  });
});

describe('generateSankeyMaticUrl', () => {
  it('should generate valid URL with compressed data', () => {
    const testData = 'Source [100.00] Target\nOther [50.00] Another';
    const url = generateSankeyMaticUrl(testData);

    expect(url).toContain('https://sankeymatic.com/build/?i=');

    // Extract compressed data and verify it can be decompressed
    const compressed = url.replace('https://sankeymatic.com/build/?i=', '');
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);

    expect(decompressed).toBe(testData);
  });

  it('should handle empty string', () => {
    const url = generateSankeyMaticUrl('');

    expect(url).toContain('https://sankeymatic.com/build/?i=');

    const compressed = url.replace('https://sankeymatic.com/build/?i=', '');
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);

    expect(decompressed).toBe('');
  });

  it('should handle multiline data', () => {
    const testData = 'Line 1\nLine 2\nLine 3';
    const url = generateSankeyMaticUrl(testData);

    const compressed = url.replace('https://sankeymatic.com/build/?i=', '');
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);

    expect(decompressed).toBe(testData);
  });

  it('should handle special characters', () => {
    const testData = 'Account (Name) [100.50] Category & Budget';
    const url = generateSankeyMaticUrl(testData);

    const compressed = url.replace('https://sankeymatic.com/build/?i=', '');
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);

    expect(decompressed).toBe(testData);
  });

  it('should use custom base URL when provided', () => {
    const testData = 'Source [100.00] Target';
    const customBaseUrl = 'https://my-sankeymatic.example.com';
    const url = generateSankeyMaticUrl(testData, customBaseUrl);

    expect(url).toContain('https://my-sankeymatic.example.com/build/?i=');
    expect(url).not.toContain('https://sankeymatic.com');

    // Verify data is still compressed correctly
    const compressed = url.replace('https://my-sankeymatic.example.com/build/?i=', '');
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
    expect(decompressed).toBe(testData);
  });

  it('should handle custom base URL with trailing slash', () => {
    const testData = 'Source [100.00] Target';
    const customBaseUrl = 'https://my-sankeymatic.example.com/';
    const url = generateSankeyMaticUrl(testData, customBaseUrl);

    // Should normalize by removing trailing slash
    expect(url).toContain('https://my-sankeymatic.example.com/build/?i=');
    expect(url).not.toContain('//build');
  });

  it('should use default URL when custom base URL is undefined', () => {
    const testData = 'Source [100.00] Target';
    const url = generateSankeyMaticUrl(testData, undefined);

    expect(url).toContain('https://sankeymatic.com/build/?i=');
  });
});
