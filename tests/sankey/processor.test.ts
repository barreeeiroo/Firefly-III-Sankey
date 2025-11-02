import { SankeyProcessor, SankeyProcessorOptions } from '../../src/sankey/processor';
import { Transaction, TransactionSplit } from '../../src/models';

describe('SankeyProcessor', () => {
  const createTransaction = (splits: Partial<TransactionSplit>[]): Transaction => ({
    type: 'transactions',
    id: '1',
    attributes: {
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user: '1',
      group_title: null,
      transactions: splits.map(s => ({
        user: '1',
        transaction_journal_id: '1',
        type: 'withdrawal',
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
        amount: '100.00',
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
        ...s,
      })) as TransactionSplit[],
    },
    links: { self: 'http://example.com' },
  });

  const baseOptions: SankeyProcessorOptions = {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  };

  describe('basic processing', () => {
    it('should process empty transaction list', () => {
      const processor = new SankeyProcessor(baseOptions);
      const result = processor.processTransactions([]);

      expect(result.nodes).toHaveLength(0);
      expect(result.links).toHaveLength(0);
      expect(result.metadata.startDate).toBe('2024-01-01');
      expect(result.metadata.endDate).toBe('2024-01-31');
      expect(result.metadata.currency).toBe('USD');
    });

    it('should process simple withdrawal (default mode)', () => {
      const transactions = [
        createTransaction([
          {
            type: 'withdrawal',
            amount: '100.00',
            category_name: 'Food',
            budget_name: 'Groceries',
          },
        ]),
      ];

      const processor = new SankeyProcessor(baseOptions);
      const result = processor.processTransactions(transactions);

      // Should have: All Funds → Budget → Category
      expect(result.nodes.find(n => n.name === 'All Funds')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Groceries')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Food')).toBeDefined();
      expect(result.links).toHaveLength(2);
    });

    it('should process simple deposit (default mode)', () => {
      const transactions = [
        createTransaction([
          {
            type: 'deposit',
            amount: '1000.00',
            source_name: 'Employer',
            destination_name: 'Checking',
            category_name: 'Salary',
          },
        ]),
      ];

      const processor = new SankeyProcessor(baseOptions);
      const result = processor.processTransactions(transactions);

      // Should have: Category → All Funds
      expect(result.nodes.find(n => n.name === 'Salary')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'All Funds')).toBeDefined();
      expect(result.links).toHaveLength(1);
    });
  });

  describe('withAccounts option', () => {
    it('should show revenue accounts when withAccounts is enabled', () => {
      const transactions = [
        createTransaction([
          {
            type: 'deposit',
            amount: '1000.00',
            source_name: 'Employer',
            destination_name: 'Checking',
            category_name: 'Salary',
          },
        ]),
      ];

      const options = { ...baseOptions, withAccounts: true };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      // Should have: Employer → Salary → All Funds
      expect(result.nodes.find(n => n.name === 'Employer')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Salary')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'All Funds')).toBeDefined();
    });

    it('should show expense accounts when withAccounts is enabled', () => {
      const transactions = [
        createTransaction([
          {
            type: 'withdrawal',
            amount: '100.00',
            destination_name: 'Supermarket',
            category_name: 'Food',
            budget_name: 'Groceries',
          },
        ]),
      ];

      const options = { ...baseOptions, withAccounts: true };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      // Should have: All Funds → Groceries → Food → Supermarket
      expect(result.nodes.find(n => n.name === 'Supermarket')).toBeDefined();
      expect(result.links).toHaveLength(3);
    });
  });

  describe('withAssets option', () => {
    it('should break down All Funds into asset accounts', () => {
      const transactions = [
        createTransaction([
          {
            type: 'deposit',
            amount: '1000.00',
            source_name: 'Employer',
            destination_name: 'Checking',
            category_name: 'Salary',
          },
        ]),
        createTransaction([
          {
            type: 'withdrawal',
            amount: '50.00',
            source_name: 'Checking',
            destination_name: 'Store',
            category_name: 'Shopping',
            budget_name: 'Misc',
          },
        ]),
      ];

      const options = { ...baseOptions, withAssets: true };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      // Should have asset accounts with (+) and (-) suffixes
      expect(result.nodes.find(n => n.name === 'Checking (+)')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Checking (-)')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'All Funds')).toBeUndefined();
    });

    it('should process transfers when withAssets is enabled', () => {
      const transactions = [
        createTransaction([
          {
            type: 'transfer',
            amount: '500.00',
            source_name: 'Checking',
            destination_name: 'Savings',
          },
        ]),
      ];

      const options = { ...baseOptions, withAssets: true };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      // Should have: Checking (+) → Savings (-)
      expect(result.nodes.find(n => n.name === 'Checking (+)')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Savings (-)')).toBeDefined();
      expect(result.links).toHaveLength(1);
    });

    it('should skip transfers when withAssets is not enabled', () => {
      const transactions = [
        createTransaction([
          {
            type: 'transfer',
            amount: '500.00',
            source_name: 'Checking',
            destination_name: 'Savings',
          },
        ]),
      ];

      const processor = new SankeyProcessor(baseOptions);
      const result = processor.processTransactions(transactions);

      expect(result.nodes).toHaveLength(0);
      expect(result.links).toHaveLength(0);
    });
  });

  describe('includeCategories and includeBudgets options', () => {
    it('should exclude categories when includeCategories is false', () => {
      const transactions = [
        createTransaction([
          {
            type: 'withdrawal',
            amount: '100.00',
            category_name: 'Food',
            budget_name: 'Groceries',
          },
        ]),
      ];

      const options = { ...baseOptions, includeCategories: false };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      // Should have: All Funds → Groceries (no Food category)
      expect(result.nodes.find(n => n.name === 'Groceries')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Food')).toBeUndefined();
    });

    it('should exclude budgets when includeBudgets is false', () => {
      const transactions = [
        createTransaction([
          {
            type: 'withdrawal',
            amount: '100.00',
            category_name: 'Food',
            budget_name: 'Groceries',
          },
        ]),
      ];

      const options = { ...baseOptions, includeBudgets: false };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      // Should have: All Funds → Food (no Groceries budget)
      expect(result.nodes.find(n => n.name === 'Food')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Groceries')).toBeUndefined();
    });

    it('should end at expense account when both categories and budgets are disabled', () => {
      const transactions = [
        createTransaction([
          {
            type: 'withdrawal',
            amount: '100.00',
            destination_name: 'Supermarket',
            category_name: 'Food',
            budget_name: 'Groceries',
          },
        ]),
      ];

      const options = {
        ...baseOptions,
        includeCategories: false,
        includeBudgets: false,
      };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      // Should have: All Funds → Supermarket (direct)
      expect(result.nodes.find(n => n.name === 'Supermarket')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Food')).toBeUndefined();
      expect(result.nodes.find(n => n.name === 'Groceries')).toBeUndefined();
    });

    it('should flow Budget → Expense when categories disabled with accounts', () => {
      const transactions = [
        createTransaction([
          {
            type: 'withdrawal',
            amount: '100.00',
            destination_name: 'Store',
            category_name: 'Food',
            budget_name: 'Groceries',
          },
        ]),
      ];

      const options = {
        ...baseOptions,
        includeCategories: false,
        withAccounts: true,
      };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      // Should have: All Funds → Groceries → Store (no Food)
      expect(result.nodes.find(n => n.name === 'All Funds')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Groceries')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Store')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Food')).toBeUndefined();
      expect(result.links).toHaveLength(2);
    });

    it('should flow Category → Expense when budgets disabled with accounts', () => {
      const transactions = [
        createTransaction([
          {
            type: 'withdrawal',
            amount: '100.00',
            destination_name: 'Store',
            category_name: 'Food',
            budget_name: 'Groceries',
          },
        ]),
      ];

      const options = {
        ...baseOptions,
        includeBudgets: false,
        withAccounts: true,
      };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      // Should have: All Funds → Food → Store (no Groceries)
      expect(result.nodes.find(n => n.name === 'All Funds')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Food')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Store')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Groceries')).toBeUndefined();
      expect(result.links).toHaveLength(2);
    });

    it('should flow Revenue → All Funds when categories disabled with accounts', () => {
      const transactions = [
        createTransaction([
          {
            type: 'deposit',
            amount: '1000.00',
            source_name: 'Employer',
            destination_name: 'Checking',
            category_name: 'Salary',
          },
        ]),
      ];

      const options = {
        ...baseOptions,
        includeCategories: false,
        withAccounts: true,
      };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      // Should have: Employer → All Funds (no Salary category)
      expect(result.nodes.find(n => n.name === 'Employer')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'All Funds')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Salary')).toBeUndefined();
      expect(result.links).toHaveLength(1);
    });

    it('should show revenue account when categories disabled and no withAccounts', () => {
      const transactions = [
        createTransaction([
          {
            type: 'deposit',
            amount: '1000.00',
            source_name: 'Employer',
            destination_name: 'Checking',
            category_name: 'Salary',
          },
        ]),
      ];

      const options = {
        ...baseOptions,
        includeCategories: false,
      };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      // Should have: Employer → All Funds (must show account when categories disabled)
      expect(result.nodes.find(n => n.name === 'Employer')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'All Funds')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Salary')).toBeUndefined();
      expect(result.links).toHaveLength(1);
    });
  });

  describe('duplicate and conflict handling', () => {
    it('should add (+)/(-) suffixes to duplicate account names', () => {
      const transactions = [
        createTransaction([
          {
            type: 'deposit',
            amount: '100.00',
            source_name: 'Cash',
            destination_name: 'Checking',
          },
        ]),
        createTransaction([
          {
            type: 'withdrawal',
            amount: '50.00',
            source_name: 'Checking',
            destination_name: 'Cash',
          },
        ]),
      ];

      const options = { ...baseOptions, withAccounts: true };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      // Cash appears as both revenue and expense
      expect(result.nodes.find(n => n.name === 'Cash (+)')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Cash (-)')).toBeDefined();
    });

    it('should add (+)/(-) suffixes to duplicate category names', () => {
      const transactions = [
        createTransaction([
          {
            type: 'deposit',
            amount: '100.00',
            source_name: 'Employer',
            destination_name: 'Checking',
            category_name: 'Misc',
          },
        ]),
        createTransaction([
          {
            type: 'withdrawal',
            amount: '50.00',
            source_name: 'Checking',
            destination_name: 'Store',
            category_name: 'Misc',
          },
        ]),
      ];

      const processor = new SankeyProcessor(baseOptions);
      const result = processor.processTransactions(transactions);

      // Misc appears as both income and expense category
      expect(result.nodes.find(n => n.name === 'Misc (+)')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Misc (-)')).toBeDefined();
    });

    it('should add type markers (A), (C), (B) for cross-type conflicts', () => {
      const transactions = [
        createTransaction([
          {
            type: 'deposit',
            amount: '100.00',
            source_name: 'Food',
            destination_name: 'Checking',
            category_name: 'Food',
          },
        ]),
        createTransaction([
          {
            type: 'withdrawal',
            amount: '50.00',
            source_name: 'Checking',
            destination_name: 'Store',
            category_name: 'Groceries',
            budget_name: 'Food',
          },
        ]),
      ];

      const options = { ...baseOptions, withAccounts: true };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      // "Food" exists as account, category, and budget
      expect(result.nodes.find(n => n.name === '(A) Food')).toBeDefined();
      expect(result.nodes.find(n => n.name === '(C) Food')).toBeDefined();
      expect(result.nodes.find(n => n.name === '(B) Food')).toBeDefined();
    });

    it('should add [NO CATEGORY] suffix for transactions without categories', () => {
      const transactions = [
        createTransaction([
          {
            type: 'deposit',
            amount: '100.00',
            source_name: 'Employer',
            destination_name: 'Checking',
            category_name: null,
          },
        ]),
      ];

      const processor = new SankeyProcessor(baseOptions);
      const result = processor.processTransactions(transactions);

      expect(result.nodes.find(n => n.name === '[NO CATEGORY] (+)')).toBeDefined();
    });

    it('should add [NO BUDGET] for transactions without budgets', () => {
      const transactions = [
        createTransaction([
          {
            type: 'withdrawal',
            amount: '100.00',
            source_name: 'Checking',
            destination_name: 'Store',
            budget_name: null,
          },
        ]),
      ];

      const processor = new SankeyProcessor(baseOptions);
      const result = processor.processTransactions(transactions);

      expect(result.nodes.find(n => n.name === '[NO BUDGET]')).toBeDefined();
    });
  });

  describe('filtering', () => {
    it('should exclude transactions by account', () => {
      const transactions = [
        createTransaction([
          {
            type: 'withdrawal',
            amount: '100.00',
            source_name: 'Checking',
            destination_name: 'Store',
          },
        ]),
      ];

      const options = { ...baseOptions, excludeAccounts: ['Store'] };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      expect(result.nodes).toHaveLength(0);
      expect(result.links).toHaveLength(0);
    });

    it('should exclude transactions by category', () => {
      const transactions = [
        createTransaction([
          {
            type: 'withdrawal',
            amount: '100.00',
            category_name: 'Food',
          },
        ]),
      ];

      const options = { ...baseOptions, excludeCategories: ['Food'] };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      expect(result.nodes).toHaveLength(0);
    });

    it('should exclude transactions by budget', () => {
      const transactions = [
        createTransaction([
          {
            type: 'withdrawal',
            amount: '100.00',
            budget_name: 'Groceries',
          },
        ]),
      ];

      const options = { ...baseOptions, excludeBudgets: ['Groceries'] };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      expect(result.nodes).toHaveLength(0);
    });

    it('should filter by minimum transaction amount', () => {
      const transactions = [
        createTransaction([
          {
            type: 'withdrawal',
            amount: '5.00',
          },
        ]),
        createTransaction([
          {
            type: 'withdrawal',
            amount: '100.00',
          },
        ]),
      ];

      const options = { ...baseOptions, minAmountTransaction: 10 };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      // Only the 100.00 transaction should be included
      expect(result.links.length).toBeGreaterThan(0);
      expect(result.links.every(l => l.value >= 10)).toBe(true);
    });

    it('should filter accounts by minimum total amount', () => {
      const transactions = [
        createTransaction([
          {
            type: 'deposit',
            amount: '1000.00',
            source_name: 'High Revenue',
            destination_name: 'Checking',
          },
        ]),
        createTransaction([
          {
            type: 'deposit',
            amount: '50.00',
            source_name: 'Low Revenue',
            destination_name: 'Checking',
          },
        ]),
      ];

      const options = {
        ...baseOptions,
        withAccounts: true,
        minAmountAccount: 100,
      };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      expect(result.nodes.find(n => n.name === 'High Revenue')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Low Revenue')).toBeUndefined();
    });
  });

  describe('grouping', () => {
    it('should group small accounts', () => {
      const transactions = [
        createTransaction([
          {
            type: 'deposit',
            amount: '500.00',
            source_name: 'Big Revenue',
            destination_name: 'Checking',
          },
        ]),
        createTransaction([
          {
            type: 'deposit',
            amount: '30.00',
            source_name: 'Small Revenue',
            destination_name: 'Checking',
          },
        ]),
      ];

      const options = {
        ...baseOptions,
        withAccounts: true,
        minAccountGroupingAmount: 100,
      };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      expect(result.nodes.find(n => n.name === 'Big Revenue')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Small Revenue')).toBeUndefined();
      expect(result.nodes.find(n => n.name === '[OTHER ACCOUNTS] (+)')).toBeDefined();
    });

    it('should group small categories', () => {
      const transactions = [
        createTransaction([
          {
            type: 'withdrawal',
            amount: '300.00',
            category_name: 'Big Category',
          },
        ]),
        createTransaction([
          {
            type: 'withdrawal',
            amount: '20.00',
            category_name: 'Small Category',
          },
        ]),
      ];

      const options = {
        ...baseOptions,
        minCategoryGroupingAmount: 50,
      };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      expect(result.nodes.find(n => n.name === 'Big Category')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Small Category')).toBeUndefined();
      expect(result.nodes.find(n => n.name === '[OTHER CATEGORIES] (-)')).toBeDefined();
    });
  });

  describe('flow aggregation', () => {
    it('should aggregate multiple flows between same nodes', () => {
      const transactions = [
        createTransaction([
          {
            type: 'withdrawal',
            amount: '50.00',
            category_name: 'Food',
          },
        ]),
        createTransaction([
          {
            type: 'withdrawal',
            amount: '75.00',
            category_name: 'Food',
          },
        ]),
      ];

      const options = { ...baseOptions, includeBudgets: false };
      const processor = new SankeyProcessor(options);
      const result = processor.processTransactions(transactions);

      // Should have one aggregated flow: All Funds -> Food with value 125
      const allFundsNode = result.nodes.find(n => n.name === 'All Funds');
      const foodNode = result.nodes.find(n => n.name === 'Food');
      const flow = result.links.find(
        l => l.source === allFundsNode?.id && l.target === foodNode?.id
      );

      expect(flow?.value).toBe(125);
    });

    it('should round flow values to 2 decimal places', () => {
      const transactions = [
        createTransaction([
          {
            type: 'withdrawal',
            amount: '33.333',
          },
        ]),
      ];

      const processor = new SankeyProcessor(baseOptions);
      const result = processor.processTransactions(transactions);

      expect(result.links.every(l => l.value === Math.round(l.value * 100) / 100)).toBe(true);
    });

    it('should handle multiple currencies', () => {
      const transactions = [
        createTransaction([
          {
            type: 'withdrawal',
            amount: '100.00',
            currency_code: 'USD',
          },
        ]),
        createTransaction([
          {
            type: 'withdrawal',
            amount: '50.00',
            currency_code: 'EUR',
          },
        ]),
      ];

      const processor = new SankeyProcessor(baseOptions);
      const result = processor.processTransactions(transactions);

      // Should have separate links for each currency
      expect(result.links.some(l => l.currency === 'USD')).toBe(true);
      expect(result.links.some(l => l.currency === 'EUR')).toBe(true);
    });
  });

  describe('metadata', () => {
    it('should include correct metadata', () => {
      const transactions = [
        createTransaction([
          {
            type: 'withdrawal',
            amount: '100.00',
            currency_code: 'EUR',
          },
        ]),
      ];

      const processor = new SankeyProcessor(baseOptions);
      const result = processor.processTransactions(transactions);

      expect(result.metadata.startDate).toBe('2024-01-01');
      expect(result.metadata.endDate).toBe('2024-01-31');
      expect(result.metadata.currency).toBe('EUR');
      expect(result.metadata.generatedAt).toBeDefined();
      expect(new Date(result.metadata.generatedAt).getTime()).not.toBeNaN();
    });

    it('should use most common currency', () => {
      const transactions = [
        createTransaction([
          { type: 'withdrawal', amount: '100.00', currency_code: 'USD' },
        ]),
        createTransaction([
          { type: 'withdrawal', amount: '50.00', currency_code: 'USD' },
        ]),
        createTransaction([
          { type: 'withdrawal', amount: '75.00', currency_code: 'EUR' },
        ]),
      ];

      const processor = new SankeyProcessor(baseOptions);
      const result = processor.processTransactions(transactions);

      expect(result.metadata.currency).toBe('USD');
    });
  });

  describe('link sorting', () => {
    it('should sort links by value descending', () => {
      const transactions = [
        createTransaction([
          {
            type: 'withdrawal',
            amount: '50.00',
            category_name: 'Small',
          },
        ]),
        createTransaction([
          {
            type: 'withdrawal',
            amount: '200.00',
            category_name: 'Large',
          },
        ]),
        createTransaction([
          {
            type: 'withdrawal',
            amount: '100.00',
            category_name: 'Medium',
          },
        ]),
      ];

      const processor = new SankeyProcessor(baseOptions);
      const result = processor.processTransactions(transactions);

      // Verify descending order
      for (let i = 0; i < result.links.length - 1; i++) {
        expect(result.links[i].value).toBeGreaterThanOrEqual(result.links[i + 1].value);
      }
    });
  });
});
