/**
 * Filtering utilities for Sankey diagram processing
 */

import { TransactionSplit } from '../models';
import { SankeyNode, SankeyLink } from './entities';
import { SankeyProcessorOptions } from './processor';

/**
 * Check if a transaction split should be excluded based on options
 */
export function shouldExcludeTransaction(
  split: TransactionSplit,
  options: SankeyProcessorOptions
): boolean {
  if (options.excludeAccounts) {
    if (
      options.excludeAccounts.includes(split.source_name) ||
      options.excludeAccounts.includes(split.destination_name)
    ) {
      return true;
    }
  }

  if (options.excludeCategories && split.category_name) {
    if (options.excludeCategories.includes(split.category_name)) {
      return true;
    }
  }

  if (options.excludeBudgets && split.budget_name) {
    if (options.excludeBudgets.includes(split.budget_name)) {
      return true;
    }
  }

  return false;
}

/**
 * Filter out revenue and expense accounts below minimum amount
 */
export function filterAccountsByAmount(
  nodes: SankeyNode[],
  links: SankeyLink[],
  minAmount: number
): { nodes: SankeyNode[]; links: SankeyLink[] } {
  // Calculate total flow for each revenue and expense account
  const accountTotals = new Map<number, number>();

  for (const link of links) {
    const sourceNode = nodes[link.source];
    const targetNode = nodes[link.target];

    // Sum flows for revenue accounts (incoming to them)
    if (sourceNode.type === 'revenue') {
      accountTotals.set(link.source, (accountTotals.get(link.source) || 0) + link.value);
    }

    // Sum flows for expense accounts (outgoing from them)
    if (targetNode.type === 'expense') {
      accountTotals.set(link.target, (accountTotals.get(link.target) || 0) + link.value);
    }
  }

  // Identify accounts to remove
  const accountsToRemove = new Set<number>();
  for (const [nodeId, total] of accountTotals.entries()) {
    if (total < minAmount) {
      accountsToRemove.add(nodeId);
    }
  }

  // Filter out links connected to removed accounts
  const filteredLinks = links.filter(
    (link) => {
      const sourceNode = nodes[link.source];
      const targetNode = nodes[link.target];

      // Remove link if either end is a filtered revenue/expense account
      if (sourceNode.type === 'revenue' && accountsToRemove.has(link.source)) {
        return false;
      }
      if (targetNode.type === 'expense' && accountsToRemove.has(link.target)) {
        return false;
      }

      return true;
    }
  );

  // Get set of node IDs that are still referenced in links
  const referencedNodes = new Set<number>();
  for (const link of filteredLinks) {
    referencedNodes.add(link.source);
    referencedNodes.add(link.target);
  }

  // Filter nodes to only those still referenced
  const filteredNodes = nodes.filter((node) => referencedNodes.has(node.id));

  // Rebuild node IDs to be sequential
  const nodeIdMap = new Map<number, number>();
  const remappedNodes = filteredNodes.map((node, index) => {
    nodeIdMap.set(node.id, index);
    return { ...node, id: index };
  });

  // Remap link node references
  const remappedLinks = filteredLinks.map((link) => ({
    ...link,
    source: nodeIdMap.get(link.source)!,
    target: nodeIdMap.get(link.target)!,
  }));

  return {
    nodes: remappedNodes,
    links: remappedLinks,
  };
}
