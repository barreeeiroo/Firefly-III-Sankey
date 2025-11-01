/**
 * Transaction processing utilities for Sankey diagram generation
 */

import { Transaction } from '../models';
import { SankeyProcessorOptions } from './processor';
import { shouldExcludeTransaction } from './filters';

export interface DuplicateNames {
  accounts: Set<string>;
  categories: Set<string>;
}

/**
 * Identify account and category names that appear as both revenue and expense
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
      }
    }
  }

  // Find accounts that appear in both sets
  const duplicateAccounts = new Set<string>();
  for (const name of revenueAccounts) {
    if (expenseAccounts.has(name)) {
      duplicateAccounts.add(name);
    }
  }

  // Find categories that appear in both sets
  const duplicateCategories = new Set<string>();
  for (const name of revenueCategories) {
    if (expenseCategories.has(name)) {
      duplicateCategories.add(name);
    }
  }

  return {
    accounts: duplicateAccounts,
    categories: duplicateCategories,
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
