/**
 * Sankey Diagram Models
 */

export interface SankeyNode {
  id: number;
  name: string;
  type: 'revenue' | 'asset' | 'expense' | 'category' | 'budget';
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
  currency: string;
}

export interface SankeyDiagram {
  nodes: SankeyNode[];
  links: SankeyLink[];
  metadata: {
    startDate: string;
    endDate: string;
    generatedAt: string;
    currency: string;
  };
}
