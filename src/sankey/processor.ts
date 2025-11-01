/**
 * Sankey Diagram Data Processor
 */

import { Transaction } from '../models';
import { SankeyDiagram, SankeyNode, SankeyLink } from './entities';

export interface SankeyProcessorOptions {
  startDate: string;
  endDate: string;
  withAccounts?: boolean;         // Show individual revenue/expense accounts as start/end nodes
  includeCategories?: boolean;    // Include category nodes (default: true)
  includeBudgets?: boolean;       // Include budget nodes (default: true)
  excludeAccounts?: string[];
  excludeCategories?: string[];
  excludeBudgets?: string[];
  minAmount?: number;
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

        // Skip if below minimum amount
        const amount = parseFloat(split.amount);
        if (this.options.minAmount && Math.abs(amount) < this.options.minAmount) {
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

        // Skip if below minimum amount
        const amount = parseFloat(split.amount);
        if (this.options.minAmount && Math.abs(amount) < this.options.minAmount) {
          continue;
        }

        // Skip transfers between owned accounts (asset to asset)
        if (split.type === 'transfer') {
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
        }
      }
    }

    // Build links from flows
    const links = this.buildLinks();

    return {
      nodes: this.nodes,
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
   */
  private processWithdrawal(split: any) {
    const amount = Math.abs(parseFloat(split.amount));

    const sourceId = this.getOrCreateNode('All Funds', 'asset');

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
   */
  private processDeposit(split: any) {
    const amount = Math.abs(parseFloat(split.amount));
    const destId = this.getOrCreateNode('All Funds', 'asset');

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
