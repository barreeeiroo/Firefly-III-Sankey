/**
 * Sankey Diagram Data Processor
 */

import { Transaction, TransactionSplit } from '../models';
import { SankeyDiagram, SankeyNode, SankeyLink } from './entities';
import { identifyDuplicates, getMostCommonCurrency } from './transactions';
import { shouldExcludeTransaction, filterAccountsByAmount } from './filters';
import { groupSmallNodes } from './groups';

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
  private identifyDuplicateNames(transactions: Transaction[]): void {
    const duplicates = identifyDuplicates(transactions, this.options);
    this.duplicateAccountNames = duplicates.accounts;
    this.duplicateCategoryNames = duplicates.categories;
  }

  /**
   * Process transactions and generate Sankey diagram data
   */
  processTransactions(transactions: Transaction[]): SankeyDiagram {
    this.nodes = [];
    this.nodeMap = {};
    this.flows = {};

    // First pass: identify accounts that appear as both revenue and expense
    this.identifyDuplicateNames(transactions);

    // Process each transaction
    for (const transaction of transactions) {
      for (const split of transaction.attributes.transactions) {
        // Skip if excluded
        if (shouldExcludeTransaction(split, this.options)) {
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
      const grouped = groupSmallNodes(
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
      const filtered = filterAccountsByAmount(nodes, links, this.options.minAmountAccount);
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
        currency: getMostCommonCurrency(transactions),
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
  private processWithdrawal(split: TransactionSplit) {
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
  private processDeposit(split: TransactionSplit) {
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
  private processTransfer(split: TransactionSplit) {
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
}
