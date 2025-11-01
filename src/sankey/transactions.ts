/**
 * Transaction processing utilities for Sankey diagram generation
 */

import { Transaction } from '../models';
import { SankeyProcessorOptions } from './processor';
import { shouldExcludeTransaction } from './filters';

export interface DuplicateNames {
  accounts: Set<string>;
  categories: Set<string>;
  accountConflicts: Set<string>; // Account names that conflict with budgets or categories
  categoryConflicts: Set<string>; // Category names that conflict with accounts or budgets
  budgetConflicts: Set<string>; // Budget names that conflict with accounts or categories
}

/**
 * Identify account and category names that appear as both revenue and expense
 * Also identify names that are used as both budgets and categories
 * This is used to determine which names need (+) and (-) suffixes to avoid conflicts
 */
export function identifyDuplicates(
  transactions: Transaction[],
  options: SankeyProcessorOptions
): DuplicateNames {
  const revenueAccounts = new Set<string>();
  const expenseAccounts = new Set<string>();
  const revenueCategories = new Set<string>();
  const expenseCategories = new Set<string>();
  const budgets = new Set<string>();

  for (const transaction of transactions) {
    for (const split of transaction.attributes.transactions) {
      // Skip if excluded
      if (shouldExcludeTransaction(split, options)) {
        continue;
      }

      // Skip if below minimum transaction amount
      const amount = parseFloat(split.amount);
      if (options.minAmountTransaction && Math.abs(amount) < options.minAmountTransaction) {
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
        if (split.budget_name) {
          budgets.add(split.budget_name);
        }
      }
    }
  }

  // Find accounts that appear in both sets (revenue and expense)
  const duplicateAccounts = new Set<string>();
  for (const name of revenueAccounts) {
    if (expenseAccounts.has(name)) {
      duplicateAccounts.add(name);
    }
  }

  // Find categories that appear in both sets (revenue and expense)
  const duplicateCategories = new Set<string>();
  for (const name of revenueCategories) {
    if (expenseCategories.has(name)) {
      duplicateCategories.add(name);
    }
  }

  // Combine all account, category, and budget names
  const allAccounts = new Set([...revenueAccounts, ...expenseAccounts]);
  const allCategories = new Set([...revenueCategories, ...expenseCategories]);

  // Find accounts that conflict with budgets or categories
  const accountConflicts = new Set<string>();
  for (const name of allAccounts) {
    if (budgets.has(name) || allCategories.has(name)) {
      accountConflicts.add(name);
    }
  }

  // Find categories that conflict with accounts or budgets
  const categoryConflicts = new Set<string>();
  for (const name of allCategories) {
    if (allAccounts.has(name) || budgets.has(name)) {
      categoryConflicts.add(name);
    }
  }

  // Find budgets that conflict with accounts or categories
  const budgetConflicts = new Set<string>();
  for (const name of budgets) {
    if (allAccounts.has(name) || allCategories.has(name)) {
      budgetConflicts.add(name);
    }
  }

  return {
    accounts: duplicateAccounts,
    categories: duplicateCategories,
    accountConflicts,
    categoryConflicts,
    budgetConflicts,
  };
}

/**
 * Get the most common currency from transactions
 */
export function getMostCommonCurrency(transactions: Transaction[]): string {
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
