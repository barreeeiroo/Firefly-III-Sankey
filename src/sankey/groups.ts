/**
 * Grouping utilities for Sankey diagram processing
 */

import { SankeyNode, SankeyLink } from './entities';

/**
 * Group small accounts and categories into [OTHER ACCOUNTS] and [OTHER CATEGORIES]
 */
export function groupSmallNodes(
  nodes: SankeyNode[],
  links: SankeyLink[],
  minAccountAmount?: number,
  minCategoryAmount?: number
): { nodes: SankeyNode[]; links: SankeyLink[] } {
  // Calculate total flow for each node
  const nodeTotals = new Map<number, number>();

  for (const link of links) {
    const sourceNode = nodes[link.source];
    const targetNode = nodes[link.target];

    // Sum flows for revenue accounts (outgoing from them)
    if (sourceNode.type === 'revenue') {
      nodeTotals.set(link.source, (nodeTotals.get(link.source) || 0) + link.value);
    }

    // Sum flows for expense accounts (incoming to them)
    if (targetNode.type === 'expense') {
      nodeTotals.set(link.target, (nodeTotals.get(link.target) || 0) + link.value);
    }

    // Sum flows for categories (both directions)
    if (sourceNode.type === 'category') {
      nodeTotals.set(link.source, (nodeTotals.get(link.source) || 0) + link.value);
    }
    if (targetNode.type === 'category') {
      nodeTotals.set(link.target, (nodeTotals.get(link.target) || 0) + link.value);
    }
  }

  // Identify nodes to group
  const nodesToGroup = new Set<number>();
  for (const [nodeId, total] of nodeTotals.entries()) {
    const node = nodes[nodeId];

    if (minAccountAmount && (node.type === 'revenue' || node.type === 'expense')) {
      if (total < minAccountAmount) {
        nodesToGroup.add(nodeId);
      }
    }

    if (minCategoryAmount && node.type === 'category') {
      if (total < minCategoryAmount) {
        nodesToGroup.add(nodeId);
      }
    }
  }

  // If no nodes to group, return as-is
  if (nodesToGroup.size === 0) {
    return { nodes, links };
  }

  // Create a map for node ID remapping
  const nodeIdMap = new Map<number, number>();
  const newNodes: SankeyNode[] = [];
  let nextId = 0;

  // Create "OTHER" nodes
  const otherRevenueId = nextId++;
  const otherExpenseId = nextId++;
  const otherCategoryIncomeId = nextId++;
  const otherCategoryExpenseId = nextId++;

  newNodes.push({ id: otherRevenueId, name: '[OTHER ACCOUNTS] (+)', type: 'revenue' });
  newNodes.push({ id: otherExpenseId, name: '[OTHER ACCOUNTS] (-)', type: 'expense' });
  newNodes.push({ id: otherCategoryIncomeId, name: '[OTHER CATEGORIES] (+)', type: 'category' });
  newNodes.push({ id: otherCategoryExpenseId, name: '[OTHER CATEGORIES] (-)', type: 'category' });

  // Track if we actually use these OTHER nodes
  const usedOtherNodes = new Set<number>();

  // Add non-grouped nodes and build mapping
  for (const node of nodes) {
    if (!nodesToGroup.has(node.id)) {
      nodeIdMap.set(node.id, nextId);
      newNodes.push({ ...node, id: nextId });
      nextId++;
    } else {
      // Map grouped nodes to their respective OTHER node
      if (node.type === 'revenue') {
        nodeIdMap.set(node.id, otherRevenueId);
        usedOtherNodes.add(otherRevenueId);
      } else if (node.type === 'expense') {
        nodeIdMap.set(node.id, otherExpenseId);
        usedOtherNodes.add(otherExpenseId);
      } else if (node.type === 'category') {
        // Determine if it's income or expense category based on name suffix
        if (node.name.includes(' (+)')) {
          nodeIdMap.set(node.id, otherCategoryIncomeId);
          usedOtherNodes.add(otherCategoryIncomeId);
        } else {
          nodeIdMap.set(node.id, otherCategoryExpenseId);
          usedOtherNodes.add(otherCategoryExpenseId);
        }
      }
    }
  }

  // Aggregate flows and remap
  const flowAggregation = new Map<string, number>();

  for (const link of links) {
    const newSource = nodeIdMap.get(link.source)!;
    const newTarget = nodeIdMap.get(link.target)!;
    const key = `${newSource}->${newTarget}:${link.currency}`;

    flowAggregation.set(key, (flowAggregation.get(key) || 0) + link.value);
  }

  // Build new links from aggregated flows
  const newLinks: SankeyLink[] = [];
  for (const [key, value] of flowAggregation.entries()) {
    const [flow, currency] = key.split(':');
    const [source, target] = flow.split('->').map(Number);

    newLinks.push({
      source,
      target,
      value: Math.round(value * 100) / 100,
      currency,
    });
  }

  // Filter out unused OTHER nodes
  const finalNodes = newNodes.filter((node) => {
    if (node.id === otherRevenueId || node.id === otherExpenseId ||
        node.id === otherCategoryIncomeId || node.id === otherCategoryExpenseId) {
      return usedOtherNodes.has(node.id);
    }
    return true;
  });

  // Rebuild IDs to be sequential
  const finalNodeIdMap = new Map<number, number>();
  const finalNodesSequential = finalNodes.map((node, index) => {
    finalNodeIdMap.set(node.id, index);
    return { ...node, id: index };
  });

  // Remap links
  const finalLinks = newLinks.map((link) => ({
    ...link,
    source: finalNodeIdMap.get(link.source)!,
    target: finalNodeIdMap.get(link.target)!,
  }));

  // Sort links by value descending
  finalLinks.sort((a, b) => b.value - a.value);

  return {
    nodes: finalNodesSequential,
    links: finalLinks,
  };
}
