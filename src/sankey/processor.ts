/**
 * Sankey Diagram Data Processor
 */

import { Transaction } from '../models';
import { SankeyDiagram, SankeyNode, SankeyLink } from './models';

export interface SankeyProcessorOptions {
  startDate: string;
  endDate: string;
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

  constructor(options: SankeyProcessorOptions) {
    this.options = options;
  }

  /**
   * Identify account names that appear as both revenue and expense
   */
  private identifyDuplicateAccounts(transactions: Transaction[]): void {
    const revenueAccounts = new Set<string>();
    const expenseAccounts = new Set<string>();

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
        } else if (split.type === 'withdrawal') {
          expenseAccounts.add(split.destination_name);
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
   * Flow: All Funds → Budget (if exists) → Category (if exists) → Expense Account
   */
  private processWithdrawal(split: any) {
    const allFundsId = this.getOrCreateNode('All Funds', 'asset');
    const amount = Math.abs(parseFloat(split.amount));

    // Only add (-) suffix if this account name appears as both revenue and expense
    const destName = this.duplicateAccountNames.has(split.destination_name)
      ? `${split.destination_name} (-)`
      : split.destination_name;
    const destId = this.getOrCreateNode(destName, 'expense');

    // Determine the flow path
    if (split.budget_name && split.category_name) {
      // All Funds → Budget → Category → Expense
      const budgetId = this.getOrCreateNode(split.budget_name, 'budget');
      const categoryId = this.getOrCreateNode(split.category_name, 'category');
      this.addFlow(allFundsId, budgetId, amount, split.currency_code);
      this.addFlow(budgetId, categoryId, amount, split.currency_code);
      this.addFlow(categoryId, destId, amount, split.currency_code);
    } else if (split.budget_name) {
      // All Funds → Budget → Expense
      const budgetId = this.getOrCreateNode(split.budget_name, 'budget');
      this.addFlow(allFundsId, budgetId, amount, split.currency_code);
      this.addFlow(budgetId, destId, amount, split.currency_code);
    } else if (split.category_name) {
      // All Funds → Category → Expense
      const categoryId = this.getOrCreateNode(split.category_name, 'category');
      this.addFlow(allFundsId, categoryId, amount, split.currency_code);
      this.addFlow(categoryId, destId, amount, split.currency_code);
    } else {
      // All Funds → Expense (direct)
      this.addFlow(allFundsId, destId, amount, split.currency_code);
    }
  }

  /**
   * Process deposit transaction (income)
   * Flow: Revenue Account → Category (if exists) → All Funds
   */
  private processDeposit(split: any) {
    // Only add (+) suffix if this account name appears as both revenue and expense
    const sourceName = this.duplicateAccountNames.has(split.source_name)
      ? `${split.source_name} (+)`
      : split.source_name;
    const sourceId = this.getOrCreateNode(sourceName, 'revenue');
    const allFundsId = this.getOrCreateNode('All Funds', 'asset');
    const amount = Math.abs(parseFloat(split.amount));

    // If there's a category, flow through category
    if (split.category_name) {
      const categoryId = this.getOrCreateNode(split.category_name, 'category');
      this.addFlow(sourceId, categoryId, amount, split.currency_code);
      this.addFlow(categoryId, allFundsId, amount, split.currency_code);
    } else {
      // Direct flow from revenue to All Funds
      this.addFlow(sourceId, allFundsId, amount, split.currency_code);
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
