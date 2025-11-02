import * as MainExports from '../src/index';

describe('Main index exports', () => {
  it('should export FireflyClient', () => {
    expect(MainExports.FireflyClient).toBeDefined();
    expect(typeof MainExports.FireflyClient).toBe('function');
  });

  it('should export model types from models module', () => {
    // These are TypeScript types, so we just verify the module doesn't throw
    // The actual type exports are verified by TypeScript compilation
    expect(MainExports).toBeDefined();
  });

  it('should export SankeyProcessor from sankey module', () => {
    expect(MainExports.SankeyProcessor).toBeDefined();
    expect(typeof MainExports.SankeyProcessor).toBe('function');
  });

  it('should export formatters from sankey module', () => {
    expect(MainExports.formatJson).toBeDefined();
    expect(typeof MainExports.formatJson).toBe('function');

    expect(MainExports.formatReadable).toBeDefined();
    expect(typeof MainExports.formatReadable).toBe('function');

    expect(MainExports.formatSankeyMatic).toBeDefined();
    expect(typeof MainExports.formatSankeyMatic).toBe('function');
  });

  it('should allow creating a FireflyClient instance', () => {
    const client = new MainExports.FireflyClient({
      baseUrl: 'https://test.example.com',
      token: 'test-token',
    });

    expect(client).toBeInstanceOf(MainExports.FireflyClient);
  });

  it('should allow creating a SankeyProcessor instance', () => {
    const processor = new MainExports.SankeyProcessor({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });

    expect(processor).toBeInstanceOf(MainExports.SankeyProcessor);
  });

  it('should allow using formatters', () => {
    const diagram: MainExports.SankeyDiagram = {
      nodes: [
        { id: 0, name: 'Source', type: 'revenue' },
        { id: 1, name: 'Target', type: 'asset' },
      ],
      links: [
        { source: 0, target: 1, value: 100, currency: 'USD' },
      ],
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        generatedAt: '2024-01-31T12:00:00.000Z',
        currency: 'USD',
      },
    };

    const json = MainExports.formatJson(diagram);
    expect(json).toContain('"nodes"');
    expect(json).toContain('"links"');

    const readable = MainExports.formatReadable(diagram);
    expect(readable).toContain('Firefly III');
    expect(readable).toContain('Source');

    const sankeymatic = MainExports.formatSankeyMatic(diagram);
    expect(sankeymatic).toContain('Source [100.00] Target');
  });
});
