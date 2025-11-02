import * as SankeyExports from '../../src/sankey';

describe('Sankey index exports', () => {
  describe('Entities', () => {
    it('should allow type usage for SankeyNode', () => {
      const node: SankeyExports.SankeyNode = {
        id: 0,
        name: 'Test Node',
        type: 'revenue',
      };

      expect(node.id).toBe(0);
      expect(node.name).toBe('Test Node');
      expect(node.type).toBe('revenue');
    });

    it('should allow type usage for SankeyLink', () => {
      const link: SankeyExports.SankeyLink = {
        source: 0,
        target: 1,
        value: 100.5,
        currency: 'USD',
      };

      expect(link.source).toBe(0);
      expect(link.target).toBe(1);
      expect(link.value).toBe(100.5);
      expect(link.currency).toBe('USD');
    });

    it('should allow type usage for SankeyDiagram', () => {
      const diagram: SankeyExports.SankeyDiagram = {
        nodes: [
          { id: 0, name: 'Revenue', type: 'revenue' },
          { id: 1, name: 'All Funds', type: 'asset' },
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

      expect(diagram.nodes).toHaveLength(2);
      expect(diagram.links).toHaveLength(1);
      expect(diagram.metadata.currency).toBe('USD');
    });
  });

  describe('Processor', () => {
    it('should export SankeyProcessor class', () => {
      expect(SankeyExports.SankeyProcessor).toBeDefined();
      expect(typeof SankeyExports.SankeyProcessor).toBe('function');
    });

    it('should allow creating a SankeyProcessor instance', () => {
      const processor = new SankeyExports.SankeyProcessor({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(processor).toBeInstanceOf(SankeyExports.SankeyProcessor);
    });

    it('should allow using SankeyProcessor to process transactions', () => {
      const processor = new SankeyExports.SankeyProcessor({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      const result = processor.processTransactions([]);

      expect(result.nodes).toEqual([]);
      expect(result.links).toEqual([]);
      expect(result.metadata.startDate).toBe('2024-01-01');
      expect(result.metadata.endDate).toBe('2024-01-31');
    });

    it('should allow type usage for SankeyProcessorOptions', () => {
      const options: SankeyExports.SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        withAccounts: true,
        withAssets: false,
        includeCategories: true,
        includeBudgets: true,
        excludeAccounts: ['Test'],
        excludeCategories: ['Test Category'],
        excludeBudgets: ['Test Budget'],
        minAmountTransaction: 10,
        minAmountAccount: 50,
        minAccountGroupingAmount: 100,
        minCategoryGroupingAmount: 75,
      };

      expect(options.startDate).toBe('2024-01-01');
      expect(options.withAccounts).toBe(true);
      expect(options.minAmountTransaction).toBe(10);
    });
  });

  describe('Formatters', () => {
    const mockDiagram: SankeyExports.SankeyDiagram = {
      nodes: [
        { id: 0, name: 'Salary', type: 'revenue' },
        { id: 1, name: 'All Funds', type: 'asset' },
        { id: 2, name: 'Groceries', type: 'expense' },
      ],
      links: [
        { source: 0, target: 1, value: 3000, currency: 'USD' },
        { source: 1, target: 2, value: 500, currency: 'USD' },
      ],
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        generatedAt: '2024-01-31T12:00:00.000Z',
        currency: 'USD',
      },
    };

    it('should export formatJson', () => {
      expect(SankeyExports.formatJson).toBeDefined();
      expect(typeof SankeyExports.formatJson).toBe('function');
    });

    it('should export formatReadable', () => {
      expect(SankeyExports.formatReadable).toBeDefined();
      expect(typeof SankeyExports.formatReadable).toBe('function');
    });

    it('should export formatSankeyMatic', () => {
      expect(SankeyExports.formatSankeyMatic).toBeDefined();
      expect(typeof SankeyExports.formatSankeyMatic).toBe('function');
    });

    it('should allow using formatJson', () => {
      const result = SankeyExports.formatJson(mockDiagram);
      expect(result).toContain('"nodes"');
      expect(result).toContain('"links"');
      expect(result).toContain('"metadata"');
      expect(JSON.parse(result)).toHaveProperty('nodes');
    });

    it('should allow using formatReadable', () => {
      const result = SankeyExports.formatReadable(mockDiagram);
      expect(result).toContain('Firefly III Sankey Diagram');
      expect(result).toContain('Period: 2024-01-01 to 2024-01-31');
      expect(result).toContain('Salary');
      expect(result).toContain('All Funds');
    });

    it('should allow using formatSankeyMatic', () => {
      const result = SankeyExports.formatSankeyMatic(mockDiagram);
      expect(result).toContain('// Firefly III Sankey Diagram');
      expect(result).toContain('Salary [3000.00] All Funds');
      expect(result).toContain('All Funds [500.00] Groceries');
    });
  });

  it('should verify all expected exports are present', () => {
    expect(SankeyExports).toBeDefined();

    // Verify classes
    expect(SankeyExports.SankeyProcessor).toBeDefined();

    // Verify functions
    expect(SankeyExports.formatJson).toBeDefined();
    expect(SankeyExports.formatReadable).toBeDefined();
    expect(SankeyExports.formatSankeyMatic).toBeDefined();
  });
});
