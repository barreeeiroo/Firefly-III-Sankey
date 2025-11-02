import { formatReadable } from '../../../src/sankey/formatters';
import { SankeyDiagram } from '../../../src/sankey/entities';

describe('formatReadable', () => {
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

  it('should include header', () => {
    const result = formatReadable(mockDiagram);
    expect(result).toContain('Firefly III Sankey Diagram');
    expect(result).toContain('============================');
  });

  it('should include period information', () => {
    const result = formatReadable(mockDiagram);
    expect(result).toContain('Period: 2024-01-01 to 2024-01-31');
  });

  it('should include generation timestamp', () => {
    const result = formatReadable(mockDiagram);
    expect(result).toContain('Generated:');
  });

  it('should include currency', () => {
    const result = formatReadable(mockDiagram);
    expect(result).toContain('Currency: USD');
  });

  it('should list all nodes with IDs and types', () => {
    const result = formatReadable(mockDiagram);

    expect(result).toContain('Nodes (6):');
    expect(result).toContain('[0] Salary (revenue)');
    expect(result).toContain('[1] Income Category (category)');
    expect(result).toContain('[2] All Funds (asset)');
    expect(result).toContain('[3] Monthly Budget (budget)');
    expect(result).toContain('[4] Expense Category (category)');
    expect(result).toContain('[5] Supermarket (expense)');
  });

  it('should list all flows with amounts', () => {
    const result = formatReadable(mockDiagram);

    expect(result).toContain('Flows (5):');
    expect(result).toContain('Salary → Income Category: 3000.00 USD');
    expect(result).toContain('Income Category → All Funds: 3000.00 USD');
    expect(result).toContain('All Funds → Monthly Budget: 1000.00 USD');
    expect(result).toContain('Monthly Budget → Expense Category: 1000.00 USD');
    expect(result).toContain('Expense Category → Supermarket: 1000.00 USD');
  });

  it('should format decimal amounts correctly', () => {
    const diagramWithDecimals: SankeyDiagram = {
      nodes: [
        { id: 0, name: 'Source', type: 'revenue' },
        { id: 1, name: 'Target', type: 'expense' },
      ],
      links: [
        { source: 0, target: 1, value: 123.456, currency: 'EUR' },
      ],
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        generatedAt: '2024-01-31T12:00:00.000Z',
        currency: 'EUR',
      },
    };

    const result = formatReadable(diagramWithDecimals);
    expect(result).toContain('123.46 EUR');
  });

  it('should handle empty diagram', () => {
    const result = formatReadable(emptyDiagram);

    expect(result).toContain('Nodes (0):');
    expect(result).toContain('Flows (0):');
    expect(result).toContain('Currency: EUR');
  });
});
