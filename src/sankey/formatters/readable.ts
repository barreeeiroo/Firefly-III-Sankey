/**
 * Human-Readable Formatter for Sankey Diagrams
 */

import { SankeyDiagram } from '../entities';

/**
 * Format Sankey diagram data in a human-readable text format
 */
export function formatReadable(data: SankeyDiagram): string {
  let output = `Firefly III Sankey Diagram
============================
Period: ${data.metadata.startDate} to ${data.metadata.endDate}
Generated: ${new Date(data.metadata.generatedAt).toLocaleString()}
Currency: ${data.metadata.currency}

Nodes (${data.nodes.length}):
`;

  for (const node of data.nodes) {
    output += `  [${node.id}] ${node.name} (${node.type})\n`;
  }

  output += `\nFlows (${data.links.length}):\n`;

  for (const link of data.links) {
    const source = data.nodes.find((n) => n.id === link.source);
    const target = data.nodes.find((n) => n.id === link.target);
    output += `  ${source?.name} → ${target?.name}: ${link.value.toFixed(2)} ${link.currency}\n`;
  }

  return output;
}
