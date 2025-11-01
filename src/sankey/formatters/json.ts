/**
 * JSON Formatter for Sankey Diagrams
 */

import { SankeyDiagram } from '../entities';

/**
 * Format Sankey diagram data as JSON
 */
export function formatJson(data: SankeyDiagram): string {
  return JSON.stringify(data, null, 2);
}
