/**
 * Sankey Diagram Data Processor
 */

import { Transaction } from '../models';
import { SankeyDiagram, SankeyNode, SankeyLink } from './entities';

export interface SankeyProcessorOptions {
  startDate: string;
  endDate: string;
  withAccounts?: boolean;         // Show individual revenue/expense accounts as start/end nodes
  withAssets?: boolean;           // Break down All Funds into individual asset accounts with transfers
  includeCategories?: boolean;    // Include category nodes (default: true)
  includeBudgets?: boolean;       // Include budget nodes (default: true)
  excludeAccounts?: string[];
  excludeCategories?: string[];
  excludeBudgets?: string[];
  minAmountTransaction?: number;  // Minimum amount for individual transactions
  minAmountAccount?: number;      // Minimum total amount for accounts/nodes
  minAccountGroupingAmount?: number;   // Group accounts below this amount into [OTHER ACCOUNTS]
  minCategoryGroupingAmount?: number;  // Group categories below this amount into [OTHER CATEGORIES]
}

interface NodeMap {
  [key: string]: number;
}

interface FlowKey {
  source: string;
  target: string;
  currency: string;
}

interface FlowMap {
  [key: string]: number;
}

export class SankeyProcessor {
  private nodes: SankeyNode[] = [];
  private nodeMap: NodeMap = {};
  private flows: FlowMap = {};
  private options: SankeyProcessorOptions;
  private duplicateAccountNames: Set<string> = new Set();
  private duplicateCategoryNames: Set<string> = new Set();

  constructor(options: SankeyProcessorOptions) {
    this.options = options;
  }

  /**
   * Identify account and category names that appear as both revenue and expense
   */
  private identifyDuplicateAccounts(transactions: Transaction[]): void {
    const revenueAccounts = new Set<string>();
    const expenseAccounts = new Set<string>();
    const revenueCategories = new Set<string>();
    const expenseCategories = new Set<string>();

    for (const transaction of transactions) {
      for (const split of transaction.attributes.transactions) {
        // Skip if excluded
        if (this.shouldExclude(split)) {
          continue;
        }

        // Skip if below minimum transaction amount
        const amount = parseFloat(split.amount);
        if (this.options.minAmountTransaction && Math.abs(amount) < this.options.minAmountTransaction) {
          continue;
        }

        // Skip transfers
        if (split.type === 'transfer') {
          continue;
        }

        // Track revenue and expense account names
        if (split.type === 'deposit') {
          revenueAccounts.add(split.source_name);
          if (split.category_name) {
            revenueCategories.add(split.category_name);
          }
        } else if (split.type === 'withdrawal') {
          expenseAccounts.add(split.destination_name);
          if (split.category_name) {
            expenseCategories.add(split.category_name);
          }
        }
      }
    }

    // Find accounts that appear in both sets
    this.duplicateAccountNames.clear();
    for (const name of revenueAccounts) {
      if (expenseAccounts.has(name)) {
        this.duplicateAccountNames.add(name);
      }
    }

    // Find categories that appear in both sets
    this.duplicateCategoryNames.clear();
    for (const name of revenueCategories) {
      if (expenseCategories.has(name)) {
        this.duplicateCategoryNames.add(name);
      }
    }
  }

  /**
   * Process transactions and generate Sankey diagram data
   */
  processTransactions(transactions: Transaction[]): SankeyDiagram {
    this.nodes = [];
    this.nodeMap = {};
    this.flows = {};

    // First pass: identify accounts that appear as both revenue and expense
    this.identifyDuplicateAccounts(transactions);

    // Process each transaction
    for (const transaction of transactions) {
      for (const split of transaction.attributes.transactions) {
        // Skip if excluded
        if (this.shouldExclude(split)) {
          continue;
        }

        // Skip if below minimum transaction amount
        const amount = parseFloat(split.amount);
        if (this.options.minAmountTransaction && Math.abs(amount) < this.options.minAmountTransaction) {
          continue;
        }

        // Process based on transaction type
        switch (split.type) {
          case 'withdrawal':
            this.processWithdrawal(split);
            break;
          case 'deposit':
            this.processDeposit(split);
            break;
          case 'transfer':
            // Only process transfers if withAssets is enabled
            if (this.options.withAssets) {
              this.processTransfer(split);
            }
            break;
        }
      }
    }

    // Build links from flows
    let links = this.buildLinks();
    let nodes = this.nodes;

    // Group small accounts and categories if thresholds are specified
    if (this.options.minAccountGroupingAmount || this.options.minCategoryGroupingAmount) {
      const grouped = this.groupSmallNodes(
        nodes,
        links,
        this.options.minAccountGroupingAmount,
        this.options.minCategoryGroupingAmount
      );
      nodes = grouped.nodes;
      links = grouped.links;
    }

    // Filter accounts by minimum amount if specified
    if (this.options.minAmountAccount && this.options.withAccounts) {
      const filtered = this.filterAccountsByAmount(nodes, links, this.options.minAmountAccount);
      nodes = filtered.nodes;
      links = filtered.links;
    }

    return {
      nodes,
      links,
      metadata: {
        startDate: this.options.startDate,
        endDate: this.options.endDate,
        generatedAt: new Date().toISOString(),
        currency: this.getMostCommonCurrency(transactions),
      },
    };
  }

  /**
   * Process withdrawal transaction (expense)
   * Flow depends on options:
   * - Default: All Funds → [Budget] → [Category]
   * - With accounts: All Funds → [Budget] → [Category] → Expense Account
   * - With assets: Asset (-) → [Budget] → [Category] → (Expense Account)
   */
  private processWithdrawal(split: any) {
    const amount = Math.abs(parseFloat(split.amount));

    // Determine source: specific asset account or "All Funds"
    const sourceId = this.options.withAssets
      ? this.getOrCreateNode(`${split.source_name} (-)`, 'asset')
      : this.getOrCreateNode('All Funds', 'asset');

    // Determine flow path based on options
    const hasBudget = this.options.includeBudgets !== false;
    const hasCategory = this.options.includeCategories !== false;
    const showExpenseAccount = this.options.withAccounts;

    // Get category name with suffix if duplicate, or use default
    const getCategoryName = () => {
      const categoryName = split.category_name || '[NO CATEGORY]';
      // Always add (-) suffix for expenses if duplicate OR if it's [NO CATEGORY]
      if (this.duplicateCategoryNames.has(categoryName) || categoryName === '[NO CATEGORY]') {
        return `${categoryName} (-)`;
      }
      return categoryName;
    };

    // Get budget name or use default
    const getBudgetName = () => {
      return split.budget_name || '[NO BUDGET]';
    };

    // Determine the final destination
    let finalDestId: number;
    if (showExpenseAccount) {
      // Only add (-) suffix if this account name appears as both revenue and expense
      const destName = this.duplicateAccountNames.has(split.destination_name)
        ? `${split.destination_name} (-)`
        : split.destination_name;
      finalDestId = this.getOrCreateNode(destName, 'expense');
    } else if (hasCategory) {
      // End at category
      finalDestId = this.getOrCreateNode(getCategoryName(), 'category');
    } else if (hasBudget) {
      // End at budget
      finalDestId = this.getOrCreateNode(getBudgetName(), 'budget');
    } else {
      // No category or budget, must show account
      const destName = this.duplicateAccountNames.has(split.destination_name)
        ? `${split.destination_name} (-)`
        : split.destination_name;
      finalDestId = this.getOrCreateNode(destName, 'expense');
    }

    if (hasBudget && hasCategory && showExpenseAccount) {
      // Source → Budget → Category → Expense Account
      const budgetId = this.getOrCreateNode(getBudgetName(), 'budget');
      const categoryId = this.getOrCreateNode(getCategoryName(), 'category');
      this.addFlow(sourceId, budgetId, amount, split.currency_code);
      this.addFlow(budgetId, categoryId, amount, split.currency_code);
      this.addFlow(categoryId, finalDestId, amount, split.currency_code);
    } else if (hasBudget && hasCategory) {
      // Source → Budget → Category (end at category)
      const budgetId = this.getOrCreateNode(getBudgetName(), 'budget');
      this.addFlow(sourceId, budgetId, amount, split.currency_code);
      this.addFlow(budgetId, finalDestId, amount, split.currency_code);
    } else if (hasBudget && showExpenseAccount) {
      // Source → Budget → Expense Account
      const budgetId = this.getOrCreateNode(getBudgetName(), 'budget');
      this.addFlow(sourceId, budgetId, amount, split.currency_code);
      this.addFlow(budgetId, finalDestId, amount, split.currency_code);
    } else if (hasCategory && showExpenseAccount) {
      // Source → Category → Expense Account
      const categoryId = this.getOrCreateNode(getCategoryName(), 'category');
      this.addFlow(sourceId, categoryId, amount, split.currency_code);
      this.addFlow(categoryId, finalDestId, amount, split.currency_code);
    } else {
      // Direct flow to final destination
      this.addFlow(sourceId, finalDestId, amount, split.currency_code);
    }
  }

  /**
   * Process deposit transaction (income)
   * Flow depends on options:
   * - Default: [Category] → All Funds
   * - With accounts: Revenue Account → [Category] → All Funds
   * - With assets: (Revenue Account) → [Category] → Asset (+)
   */
  private processDeposit(split: any) {
    const amount = Math.abs(parseFloat(split.amount));

    // Determine destination: specific asset account or "All Funds"
    const destId = this.options.withAssets
      ? this.getOrCreateNode(`${split.destination_name} (+)`, 'asset')
      : this.getOrCreateNode('All Funds', 'asset');

    // Check if category should be included
    const hasCategory = this.options.includeCategories !== false;
    const showRevenueAccount = this.options.withAccounts;

    // Get category name with suffix if duplicate, or use default
    const getCategoryName = () => {
      const categoryName = split.category_name || '[NO CATEGORY]';
      // Always add (+) suffix for income if duplicate OR if it's [NO CATEGORY]
      if (this.duplicateCategoryNames.has(categoryName) || categoryName === '[NO CATEGORY]') {
        return `${categoryName} (+)`;
      }
      return categoryName;
    };

    if (showRevenueAccount && hasCategory) {
      // Revenue Account → Category → All Funds
      const sourceName = this.duplicateAccountNames.has(split.source_name)
        ? `${split.source_name} (+)`
        : split.source_name;
      const revenueId = this.getOrCreateNode(sourceName, 'revenue');
      const categoryId = this.getOrCreateNode(getCategoryName(), 'category');
      this.addFlow(revenueId, categoryId, amount, split.currency_code);
      this.addFlow(categoryId, destId, amount, split.currency_code);
    } else if (showRevenueAccount) {
      // Revenue Account → All Funds (no category)
      const sourceName = this.duplicateAccountNames.has(split.source_name)
        ? `${split.source_name} (+)`
        : split.source_name;
      const revenueId = this.getOrCreateNode(sourceName, 'revenue');
      this.addFlow(revenueId, destId, amount, split.currency_code);
    } else if (hasCategory) {
      // Category → All Funds (no account shown)
      const categoryId = this.getOrCreateNode(getCategoryName(), 'category');
      this.addFlow(categoryId, destId, amount, split.currency_code);
    } else {
      // Direct flow: must show account when no category
      const sourceName = this.duplicateAccountNames.has(split.source_name)
        ? `${split.source_name} (+)`
        : split.source_name;
      const revenueId = this.getOrCreateNode(sourceName, 'revenue');
      this.addFlow(revenueId, destId, amount, split.currency_code);
    }
  }

  /**
   * Process transfer transaction (between asset accounts)
   * Flow: Asset (+) → Asset (-)
   * Only called when withAssets is enabled
   */
  private processTransfer(split: any) {
    const amount = Math.abs(parseFloat(split.amount));

    // Source asset account (+) sends money
    const sourceId = this.getOrCreateNode(`${split.source_name} (+)`, 'asset');

    // Destination asset account (-) receives money
    const destId = this.getOrCreateNode(`${split.destination_name} (-)`, 'asset');

    // Direct flow from source (+) to destination (-)
    this.addFlow(sourceId, destId, amount, split.currency_code);
  }

  /**
   * Get or create a node, returning its ID
   */
  private getOrCreateNode(name: string, type: SankeyNode['type']): number {
    const key = `${type}:${name}`;

    if (key in this.nodeMap) {
      return this.nodeMap[key];
    }

    const id = this.nodes.length;
    this.nodes.push({ id, name, type });
    this.nodeMap[key] = id;
    return id;
  }

  /**
   * Add a flow between two nodes
   */
  private addFlow(sourceId: number, targetId: number, amount: number, currency: string) {
    const key = `${sourceId}->${targetId}:${currency}`;

    if (key in this.flows) {
      this.flows[key] += amount;
    } else {
      this.flows[key] = amount;
    }
  }

  /**
   * Build links array from flows map
   */
  private buildLinks(): SankeyLink[] {
    const links: SankeyLink[] = [];

    for (const [key, value] of Object.entries(this.flows)) {
      const [flow, currency] = key.split(':');
      const [source, target] = flow.split('->').map(Number);

      links.push({
        source,
        target,
        value: Math.round(value * 100) / 100, // Round to 2 decimal places
        currency,
      });
    }

    // Sort by value descending
    links.sort((a, b) => b.value - a.value);

    return links;
  }

  /**
   * Filter out revenue and expense accounts below minimum amount
   */
  private filterAccountsByAmount(
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

  /**
   * Group small accounts and categories into [OTHER ACCOUNTS] and [OTHER CATEGORIES]
   */
  private groupSmallNodes(
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

  /**
   * Check if a transaction should be excluded
   */
  private shouldExclude(split: any): boolean {
    if (this.options.excludeAccounts) {
      if (
        this.options.excludeAccounts.includes(split.source_name) ||
        this.options.excludeAccounts.includes(split.destination_name)
      ) {
        return true;
      }
    }

    if (this.options.excludeCategories && split.category_name) {
      if (this.options.excludeCategories.includes(split.category_name)) {
        return true;
      }
    }

    if (this.options.excludeBudgets && split.budget_name) {
      if (this.options.excludeBudgets.includes(split.budget_name)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get the most common currency from transactions
   */
  private getMostCommonCurrency(transactions: Transaction[]): string {
    const currencyCounts: { [key: string]: number } = {};

    for (const transaction of transactions) {
      for (const split of transaction.attributes.transactions) {
        const currency = split.currency_code;
        currencyCounts[currency] = (currencyCounts[currency] || 0) + 1;
      }
    }

    let mostCommon = 'USD';
    let maxCount = 0;

    for (const [currency, count] of Object.entries(currencyCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = currency;
      }
    }

    return mostCommon;
  }
}
