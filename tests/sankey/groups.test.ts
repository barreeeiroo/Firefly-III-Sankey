import { groupSmallNodes } from '../../src/sankey/groups';
import { SankeyNode, SankeyLink } from '../../src/sankey/entities';

describe('groups', () => {
  describe('groupSmallNodes', () => {
    it('should return unchanged data when no thresholds are set', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'Small Revenue', type: 'revenue' },
        { id: 1, name: 'All Funds', type: 'asset' },
        { id: 2, name: 'Small Expense', type: 'expense' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 1, value: 10, currency: 'USD' },
        { source: 1, target: 2, value: 10, currency: 'USD' },
      ];

      const result = groupSmallNodes(nodes, links);

      expect(result.nodes).toHaveLength(3);
      expect(result.links).toHaveLength(2);
    });

    it('should group small revenue accounts', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'High Revenue', type: 'revenue' },
        { id: 1, name: 'Low Revenue', type: 'revenue' },
        { id: 2, name: 'All Funds', type: 'asset' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 2, value: 500, currency: 'USD' },
        { source: 1, target: 2, value: 50, currency: 'USD' },
      ];

      const result = groupSmallNodes(nodes, links, 100);

      // Should have: [OTHER ACCOUNTS] (+), High Revenue, All Funds
      expect(result.nodes).toHaveLength(3);
      expect(result.nodes.find(n => n.name === '[OTHER ACCOUNTS] (+)')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'High Revenue')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Low Revenue')).toBeUndefined();
    });

    it('should group small expense accounts', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'All Funds', type: 'asset' },
        { id: 1, name: 'High Expense', type: 'expense' },
        { id: 2, name: 'Low Expense', type: 'expense' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 1, value: 400, currency: 'USD' },
        { source: 0, target: 2, value: 30, currency: 'USD' },
      ];

      const result = groupSmallNodes(nodes, links, 100);

      // Should have: All Funds, High Expense, [OTHER ACCOUNTS] (-)
      expect(result.nodes).toHaveLength(3);
      expect(result.nodes.find(n => n.name === '[OTHER ACCOUNTS] (-)')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'High Expense')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Low Expense')).toBeUndefined();
    });

    it('should group small income categories', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'Revenue', type: 'revenue' },
        { id: 1, name: 'High Category (+)', type: 'category' },
        { id: 2, name: 'Low Category (+)', type: 'category' },
        { id: 3, name: 'All Funds', type: 'asset' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 1, value: 300, currency: 'USD' },
        { source: 0, target: 2, value: 20, currency: 'USD' },
        { source: 1, target: 3, value: 300, currency: 'USD' },
        { source: 2, target: 3, value: 20, currency: 'USD' },
      ];

      const result = groupSmallNodes(nodes, links, undefined, 50);

      expect(result.nodes.find(n => n.name === '[OTHER CATEGORIES] (+)')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'High Category (+)')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Low Category (+)')).toBeUndefined();
    });

    it('should group small expense categories', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'All Funds', type: 'asset' },
        { id: 1, name: 'High Category (-)', type: 'category' },
        { id: 2, name: 'Low Category (-)', type: 'category' },
        { id: 3, name: 'Expense', type: 'expense' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 1, value: 250, currency: 'USD' },
        { source: 0, target: 2, value: 15, currency: 'USD' },
        { source: 1, target: 3, value: 250, currency: 'USD' },
        { source: 2, target: 3, value: 15, currency: 'USD' },
      ];

      const result = groupSmallNodes(nodes, links, undefined, 50);

      expect(result.nodes.find(n => n.name === '[OTHER CATEGORIES] (-)')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'High Category (-)')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Low Category (-)')).toBeUndefined();
    });

    it('should aggregate flows to grouped nodes', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'Low Revenue 1', type: 'revenue' },
        { id: 1, name: 'Low Revenue 2', type: 'revenue' },
        { id: 2, name: 'All Funds', type: 'asset' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 2, value: 30, currency: 'USD' },
        { source: 1, target: 2, value: 40, currency: 'USD' },
      ];

      const result = groupSmallNodes(nodes, links, 100);

      // Both revenue accounts should be grouped
      expect(result.nodes.find(n => n.name === '[OTHER ACCOUNTS] (+)')).toBeDefined();

      // Should have one aggregated flow: [OTHER ACCOUNTS] -> All Funds with value 70
      const otherAccountsNode = result.nodes.find(n => n.name === '[OTHER ACCOUNTS] (+)');
      const allFundsNode = result.nodes.find(n => n.name === 'All Funds');
      const aggregatedLink = result.links.find(
        l => l.source === otherAccountsNode?.id && l.target === allFundsNode?.id
      );

      expect(aggregatedLink).toBeDefined();
      expect(aggregatedLink?.value).toBe(70);
    });

    it('should not create OTHER nodes if no nodes are grouped', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'High Revenue', type: 'revenue' },
        { id: 1, name: 'All Funds', type: 'asset' },
        { id: 2, name: 'High Expense', type: 'expense' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 1, value: 500, currency: 'USD' },
        { source: 1, target: 2, value: 500, currency: 'USD' },
      ];

      const result = groupSmallNodes(nodes, links, 100);

      expect(result.nodes.find(n => n.name.includes('OTHER'))).toBeUndefined();
      expect(result.nodes).toHaveLength(3);
    });

    it('should handle both account and category grouping simultaneously', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'Low Revenue', type: 'revenue' },
        { id: 1, name: 'Low Category (+)', type: 'category' },
        { id: 2, name: 'All Funds', type: 'asset' },
        { id: 3, name: 'Low Category (-)', type: 'category' },
        { id: 4, name: 'Low Expense', type: 'expense' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 1, value: 20, currency: 'USD' },
        { source: 1, target: 2, value: 20, currency: 'USD' },
        { source: 2, target: 3, value: 20, currency: 'USD' },
        { source: 3, target: 4, value: 20, currency: 'USD' },
      ];

      const result = groupSmallNodes(nodes, links, 100, 50);

      expect(result.nodes.find(n => n.name === '[OTHER ACCOUNTS] (+)')).toBeDefined();
      expect(result.nodes.find(n => n.name === '[OTHER ACCOUNTS] (-)')).toBeDefined();
      expect(result.nodes.find(n => n.name === '[OTHER CATEGORIES] (+)')).toBeDefined();
      expect(result.nodes.find(n => n.name === '[OTHER CATEGORIES] (-)')).toBeDefined();
    });

    it('should preserve non-grouped nodes', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'High Revenue', type: 'revenue' },
        { id: 1, name: 'Low Revenue', type: 'revenue' },
        { id: 2, name: 'Category', type: 'category' },
        { id: 3, name: 'All Funds', type: 'asset' },
        { id: 4, name: 'Budget', type: 'budget' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 2, value: 500, currency: 'USD' },
        { source: 1, target: 2, value: 30, currency: 'USD' },
        { source: 2, target: 3, value: 530, currency: 'USD' },
        { source: 3, target: 4, value: 530, currency: 'USD' },
      ];

      const result = groupSmallNodes(nodes, links, 100);

      expect(result.nodes.find(n => n.name === 'High Revenue')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Category')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'All Funds')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Budget')).toBeDefined();
    });

    it('should remap node IDs to be sequential', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'Revenue', type: 'revenue' },
        { id: 1, name: 'All Funds', type: 'asset' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 1, value: 100, currency: 'USD' },
      ];

      const result = groupSmallNodes(nodes, links, 50);

      // Check that IDs are 0, 1, 2, ... sequential
      const ids = result.nodes.map(n => n.id).sort((a, b) => a - b);
      for (let i = 0; i < ids.length; i++) {
        expect(ids[i]).toBe(i);
      }
    });

    it('should round aggregated values to 2 decimal places', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'Low 1', type: 'revenue' },
        { id: 1, name: 'Low 2', type: 'revenue' },
        { id: 2, name: 'All Funds', type: 'asset' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 2, value: 33.333, currency: 'USD' },
        { source: 1, target: 2, value: 33.333, currency: 'USD' },
      ];

      const result = groupSmallNodes(nodes, links, 100);

      const aggregatedLink = result.links[0];
      expect(aggregatedLink.value).toBe(66.67); // Rounded
    });

    it('should sort links by value descending', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'Rev 1', type: 'revenue' },
        { id: 1, name: 'Rev 2', type: 'revenue' },
        { id: 2, name: 'Rev 3', type: 'revenue' },
        { id: 3, name: 'Rev 4', type: 'revenue' },
        { id: 4, name: 'All Funds', type: 'asset' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 4, value: 20, currency: 'USD' },  // Will be grouped
        { source: 1, target: 4, value: 500, currency: 'USD' },
        { source: 2, target: 4, value: 300, currency: 'USD' },
        { source: 3, target: 4, value: 30, currency: 'USD' },  // Will be grouped
      ];

      // Group with threshold 100 - Rev 1 and Rev 4 should be grouped
      const result = groupSmallNodes(nodes, links, 100);

      // Should have: [OTHER] (50), Rev 2 (500), Rev 3 (300)
      // After sorting: 500, 300, 50
      expect(result.links).toHaveLength(3);
      expect(result.links[0].value).toBe(500);
      expect(result.links[1].value).toBe(300);
      expect(result.links[2].value).toBe(50);
    });

    it('should handle multiple currencies', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'Low Revenue 1', type: 'revenue' },
        { id: 1, name: 'Low Revenue 2', type: 'revenue' },
        { id: 2, name: 'All Funds', type: 'asset' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 2, value: 30, currency: 'USD' },
        { source: 1, target: 2, value: 40, currency: 'EUR' },
      ];

      const result = groupSmallNodes(nodes, links, 100);

      // Should have separate links for each currency
      expect(result.links.some(l => l.currency === 'USD')).toBe(true);
      expect(result.links.some(l => l.currency === 'EUR')).toBe(true);
    });

    it('should handle empty input', () => {
      const result = groupSmallNodes([], [], 100, 50);

      expect(result.nodes).toHaveLength(0);
      expect(result.links).toHaveLength(0);
    });

    it('should sum flows in both directions for categories', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'Revenue', type: 'revenue' },
        { id: 1, name: 'Category (+)', type: 'category' },
        { id: 2, name: 'All Funds', type: 'asset' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 1, value: 30, currency: 'USD' },
        { source: 1, target: 2, value: 30, currency: 'USD' },
      ];

      // Total for category: 30 (incoming) + 30 (outgoing) = 60, should be grouped
      const result = groupSmallNodes(nodes, links, undefined, 100);

      expect(result.nodes.find(n => n.name === '[OTHER CATEGORIES] (+)')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Category (+)')).toBeUndefined();
    });
  });
});
