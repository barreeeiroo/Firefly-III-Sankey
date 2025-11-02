import { formatJson } from '../../../src/sankey/formatters';
import { SankeyDiagram } from '../../../src/sankey/entities';

describe('formatJson', () => {
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

  it('should format diagram as valid JSON', () => {
    const result = formatJson(mockDiagram);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('should include all diagram data', () => {
    const result = formatJson(mockDiagram);
    const parsed = JSON.parse(result);

    expect(parsed.nodes).toHaveLength(6);
    expect(parsed.links).toHaveLength(5);
    expect(parsed.metadata).toBeDefined();
  });

  it('should preserve node data', () => {
    const result = formatJson(mockDiagram);
    const parsed = JSON.parse(result);

    expect(parsed.nodes[0]).toEqual({
      id: 0,
      name: 'Salary',
      type: 'revenue',
    });
  });

  it('should preserve link data', () => {
    const result = formatJson(mockDiagram);
    const parsed = JSON.parse(result);

    expect(parsed.links[0]).toEqual({
      source: 0,
      target: 1,
      value: 3000.0,
      currency: 'USD',
    });
  });

  it('should preserve metadata', () => {
    const result = formatJson(mockDiagram);
    const parsed = JSON.parse(result);

    expect(parsed.metadata.startDate).toBe('2024-01-01');
    expect(parsed.metadata.endDate).toBe('2024-01-31');
    expect(parsed.metadata.currency).toBe('USD');
  });

  it('should format with proper indentation', () => {
    const result = formatJson(mockDiagram);
    expect(result).toContain('  ');
    expect(result).toContain('\n');
  });

  it('should handle empty diagram', () => {
    const result = formatJson(emptyDiagram);
    const parsed = JSON.parse(result);

    expect(parsed.nodes).toHaveLength(0);
    expect(parsed.links).toHaveLength(0);
    expect(parsed.metadata).toBeDefined();
  });
});
