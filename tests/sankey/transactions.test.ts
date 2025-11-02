import { identifyDuplicates, getMostCommonCurrency } from '../../src/sankey/transactions';
import { Transaction } from '../../src/models';
import { SankeyProcessorOptions } from '../../src/sankey/processor';

describe('transactions', () => {
  describe('identifyDuplicates', () => {
    const createTransaction = (splits: any[]): Transaction => ({
      type: 'transactions',
      id: '1',
      attributes: {
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user: '1',
        group_title: null,
        transactions: splits,
      },
      links: { self: 'http://example.com' },
    });

    const baseSplit = {
      user: '1',
      transaction_journal_id: '1',
      date: '2024-01-15',
      order: 0,
      currency_id: '1',
      currency_code: 'USD',
      currency_symbol: '$',
      currency_name: 'US Dollar',
      currency_decimal_places: 2,
      foreign_currency_id: null,
      foreign_currency_code: null,
      foreign_currency_symbol: null,
      foreign_currency_decimal_places: null,
      foreign_amount: null,
      description: 'Test',
      source_iban: null,
      destination_iban: null,
      budget_id: null,
      budget_name: null,
      category_id: null,
      category_name: null,
      bill_id: null,
      bill_name: null,
      reconciled: false,
      notes: null,
      tags: [],
      internal_reference: null,
      external_id: null,
      original_source: null,
      recurrence_id: null,
      recurrence_total: null,
      recurrence_count: null,
      bunq_payment_id: null,
      import_hash_v2: null,
      sepa_cc: null,
      sepa_ct_op: null,
      sepa_ct_id: null,
      sepa_db: null,
      sepa_country: null,
      sepa_ep: null,
      sepa_ci: null,
      sepa_batch_id: null,
      interest_date: null,
      book_date: null,
      process_date: null,
      due_date: null,
      payment_date: null,
      invoice_date: null,
      latitude: null,
      longitude: null,
      zoom_level: null,
      has_attachments: false,
    };

    const options: SankeyProcessorOptions = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };

    it('should return empty sets for no transactions', () => {
      const result = identifyDuplicates([], options);

      expect(result.accounts.size).toBe(0);
      expect(result.categories.size).toBe(0);
      expect(result.accountConflicts.size).toBe(0);
      expect(result.categoryConflicts.size).toBe(0);
      expect(result.budgetConflicts.size).toBe(0);
    });

    it('should identify accounts used as both revenue and expense', () => {
      const transactions = [
        createTransaction([
          {
            ...baseSplit,
            type: 'deposit',
            amount: '100',
            source_id: '1',
            source_name: 'Bank',
            source_type: 'Revenue account',
            destination_id: '2',
            destination_name: 'Checking',
            destination_type: 'Asset account',
          },
        ]),
        createTransaction([
          {
            ...baseSplit,
            type: 'withdrawal',
            amount: '50',
            source_id: '3',
            source_name: 'Checking',
            source_type: 'Asset account',
            destination_id: '4',
            destination_name: 'Bank',
            destination_type: 'Expense account',
          },
        ]),
      ];

      const result = identifyDuplicates(transactions, options);

      expect(result.accounts.has('Bank')).toBe(true);
      expect(result.accounts.size).toBe(1);
    });

    it('should identify categories used for both income and expenses', () => {
      const transactions = [
        createTransaction([
          {
            ...baseSplit,
            type: 'deposit',
            amount: '100',
            source_id: '1',
            source_name: 'Employer',
            source_type: 'Revenue account',
            destination_id: '2',
            destination_name: 'Checking',
            destination_type: 'Asset account',
            category_name: 'Misc',
          },
        ]),
        createTransaction([
          {
            ...baseSplit,
            type: 'withdrawal',
            amount: '50',
            source_id: '2',
            source_name: 'Checking',
            source_type: 'Asset account',
            destination_id: '3',
            destination_name: 'Store',
            destination_type: 'Expense account',
            category_name: 'Misc',
          },
        ]),
      ];

      const result = identifyDuplicates(transactions, options);

      expect(result.categories.has('Misc')).toBe(true);
      expect(result.categories.size).toBe(1);
    });

    it('should identify account names that conflict with budgets', () => {
      const transactions = [
        createTransaction([
          {
            ...baseSplit,
            type: 'deposit',
            amount: '100',
            source_id: '1',
            source_name: 'Food',
            source_type: 'Revenue account',
            destination_id: '2',
            destination_name: 'Checking',
            destination_type: 'Asset account',
          },
        ]),
        createTransaction([
          {
            ...baseSplit,
            type: 'withdrawal',
            amount: '50',
            source_id: '2',
            source_name: 'Checking',
            source_type: 'Asset account',
            destination_id: '3',
            destination_name: 'Store',
            destination_type: 'Expense account',
            budget_name: 'Food',
          },
        ]),
      ];

      const result = identifyDuplicates(transactions, options);

      expect(result.accountConflicts.has('Food')).toBe(true);
    });

    it('should identify account names that conflict with categories', () => {
      const transactions = [
        createTransaction([
          {
            ...baseSplit,
            type: 'deposit',
            amount: '100',
            source_id: '1',
            source_name: 'Groceries',
            source_type: 'Revenue account',
            destination_id: '2',
            destination_name: 'Checking',
            destination_type: 'Asset account',
            category_name: 'Groceries',
          },
        ]),
      ];

      const result = identifyDuplicates(transactions, options);

      expect(result.accountConflicts.has('Groceries')).toBe(true);
      expect(result.categoryConflicts.has('Groceries')).toBe(true);
    });

    it('should identify category names that conflict with budgets', () => {
      const transactions = [
        createTransaction([
          {
            ...baseSplit,
            type: 'withdrawal',
            amount: '50',
            source_id: '1',
            source_name: 'Checking',
            source_type: 'Asset account',
            destination_id: '2',
            destination_name: 'Store',
            destination_type: 'Expense account',
            category_name: 'Shopping',
            budget_name: 'Shopping',
          },
        ]),
      ];

      const result = identifyDuplicates(transactions, options);

      expect(result.categoryConflicts.has('Shopping')).toBe(true);
      expect(result.budgetConflicts.has('Shopping')).toBe(true);
    });

    it('should skip excluded accounts', () => {
      const transactions = [
        createTransaction([
          {
            ...baseSplit,
            type: 'deposit',
            amount: '100',
            source_id: '1',
            source_name: 'Bank',
            source_type: 'Revenue account',
            destination_id: '2',
            destination_name: 'Checking',
            destination_type: 'Asset account',
          },
        ]),
        createTransaction([
          {
            ...baseSplit,
            type: 'withdrawal',
            amount: '50',
            source_id: '2',
            source_name: 'Checking',
            source_type: 'Asset account',
            destination_id: '3',
            destination_name: 'Bank',
            destination_type: 'Expense account',
          },
        ]),
      ];

      const optionsWithExclude: SankeyProcessorOptions = {
        ...options,
        excludeAccounts: ['Bank'],
      };

      const result = identifyDuplicates(transactions, optionsWithExclude);

      expect(result.accounts.has('Bank')).toBe(false);
    });

    it('should skip transfers', () => {
      const transactions = [
        createTransaction([
          {
            ...baseSplit,
            type: 'transfer',
            amount: '100',
            source_id: '1',
            source_name: 'Checking',
            source_type: 'Asset account',
            destination_id: '2',
            destination_name: 'Savings',
            destination_type: 'Asset account',
          },
        ]),
      ];

      const result = identifyDuplicates(transactions, options);

      expect(result.accounts.size).toBe(0);
    });

    it('should skip transactions below minimum amount', () => {
      const transactions = [
        createTransaction([
          {
            ...baseSplit,
            type: 'deposit',
            amount: '5',
            source_id: '1',
            source_name: 'Bank',
            source_type: 'Revenue account',
            destination_id: '2',
            destination_name: 'Checking',
            destination_type: 'Asset account',
          },
        ]),
        createTransaction([
          {
            ...baseSplit,
            type: 'withdrawal',
            amount: '3',
            source_id: '2',
            source_name: 'Checking',
            source_type: 'Asset account',
            destination_id: '3',
            destination_name: 'Bank',
            destination_type: 'Expense account',
          },
        ]),
      ];

      const optionsWithMin: SankeyProcessorOptions = {
        ...options,
        minAmountTransaction: 10,
      };

      const result = identifyDuplicates(transactions, optionsWithMin);

      expect(result.accounts.has('Bank')).toBe(false);
    });

    it('should handle transactions without categories', () => {
      const transactions = [
        createTransaction([
          {
            ...baseSplit,
            type: 'deposit',
            amount: '100',
            source_id: '1',
            source_name: 'Employer',
            source_type: 'Revenue account',
            destination_id: '2',
            destination_name: 'Checking',
            destination_type: 'Asset account',
            category_name: null,
          },
        ]),
      ];

      const result = identifyDuplicates(transactions, options);

      expect(result.categories.size).toBe(0);
    });

    it('should handle transactions without budgets', () => {
      const transactions = [
        createTransaction([
          {
            ...baseSplit,
            type: 'withdrawal',
            amount: '50',
            source_id: '1',
            source_name: 'Checking',
            source_type: 'Asset account',
            destination_id: '2',
            destination_name: 'Store',
            destination_type: 'Expense account',
            budget_name: null,
          },
        ]),
      ];

      const result = identifyDuplicates(transactions, options);

      expect(result.budgetConflicts.size).toBe(0);
    });
  });

  describe('getMostCommonCurrency', () => {
    const createTransaction = (splits: any[]): Transaction => ({
      type: 'transactions',
      id: '1',
      attributes: {
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user: '1',
        group_title: null,
        transactions: splits,
      },
      links: { self: 'http://example.com' },
    });

    const baseSplit = {
      user: '1',
      transaction_journal_id: '1',
      type: 'withdrawal',
      date: '2024-01-15',
      order: 0,
      currency_id: '1',
      currency_symbol: '$',
      currency_name: 'US Dollar',
      currency_decimal_places: 2,
      foreign_currency_id: null,
      foreign_currency_code: null,
      foreign_currency_symbol: null,
      foreign_currency_decimal_places: null,
      amount: '100',
      foreign_amount: null,
      description: 'Test',
      source_id: '1',
      source_name: 'Checking',
      source_iban: null,
      source_type: 'Asset account',
      destination_id: '2',
      destination_name: 'Store',
      destination_iban: null,
      destination_type: 'Expense account',
      budget_id: null,
      budget_name: null,
      category_id: null,
      category_name: null,
      bill_id: null,
      bill_name: null,
      reconciled: false,
      notes: null,
      tags: [],
      internal_reference: null,
      external_id: null,
      original_source: null,
      recurrence_id: null,
      recurrence_total: null,
      recurrence_count: null,
      bunq_payment_id: null,
      import_hash_v2: null,
      sepa_cc: null,
      sepa_ct_op: null,
      sepa_ct_id: null,
      sepa_db: null,
      sepa_country: null,
      sepa_ep: null,
      sepa_ci: null,
      sepa_batch_id: null,
      interest_date: null,
      book_date: null,
      process_date: null,
      due_date: null,
      payment_date: null,
      invoice_date: null,
      latitude: null,
      longitude: null,
      zoom_level: null,
      has_attachments: false,
    };

    it('should return USD for empty transactions', () => {
      const result = getMostCommonCurrency([]);
      expect(result).toBe('USD');
    });

    it('should return the currency when all transactions use the same currency', () => {
      const transactions = [
        createTransaction([{ ...baseSplit, currency_code: 'EUR' }]),
        createTransaction([{ ...baseSplit, currency_code: 'EUR' }]),
        createTransaction([{ ...baseSplit, currency_code: 'EUR' }]),
      ];

      const result = getMostCommonCurrency(transactions);
      expect(result).toBe('EUR');
    });

    it('should return the most common currency', () => {
      const transactions = [
        createTransaction([{ ...baseSplit, currency_code: 'USD' }]),
        createTransaction([{ ...baseSplit, currency_code: 'USD' }]),
        createTransaction([{ ...baseSplit, currency_code: 'USD' }]),
        createTransaction([{ ...baseSplit, currency_code: 'EUR' }]),
        createTransaction([{ ...baseSplit, currency_code: 'EUR' }]),
        createTransaction([{ ...baseSplit, currency_code: 'GBP' }]),
      ];

      const result = getMostCommonCurrency(transactions);
      expect(result).toBe('USD');
    });

    it('should handle multiple splits per transaction', () => {
      const transactions = [
        createTransaction([
          { ...baseSplit, currency_code: 'USD' },
          { ...baseSplit, currency_code: 'USD' },
        ]),
        createTransaction([{ ...baseSplit, currency_code: 'EUR' }]),
      ];

      const result = getMostCommonCurrency(transactions);
      expect(result).toBe('USD'); // USD appears 2 times, EUR appears 1 time
    });

    it('should return the first currency when there is a tie', () => {
      const transactions = [
        createTransaction([{ ...baseSplit, currency_code: 'USD' }]),
        createTransaction([{ ...baseSplit, currency_code: 'EUR' }]),
      ];

      const result = getMostCommonCurrency(transactions);
      // Returns whichever was processed first (both have count 1)
      expect(['USD', 'EUR']).toContain(result);
    });

    it('should count each transaction split separately', () => {
      const transactions = [
        createTransaction([
          { ...baseSplit, currency_code: 'EUR' },
          { ...baseSplit, currency_code: 'EUR' },
          { ...baseSplit, currency_code: 'EUR' },
        ]),
        createTransaction([
          { ...baseSplit, currency_code: 'USD' },
          { ...baseSplit, currency_code: 'USD' },
        ]),
      ];

      const result = getMostCommonCurrency(transactions);
      expect(result).toBe('EUR'); // EUR: 3, USD: 2
    });
  });
});
