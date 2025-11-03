import { shouldExcludeTransaction, filterAccountsByAmount } from '../../src/sankey/filters';
import { TransactionSplit } from '../../src/models';
import { SankeyNode, SankeyLink } from '../../src/sankey/entities';
import { SankeyProcessorOptions } from '../../src/sankey/processor';

describe('filters', () => {
  describe('shouldExcludeTransaction', () => {
    const mockSplit: TransactionSplit = {
      user: '1',
      transaction_journal_id: '123',
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
      description: 'Test transaction',
      source_id: '1',
      source_name: 'Checking Account',
      source_iban: null,
      source_type: 'Asset account',
      destination_id: '2',
      destination_name: 'Supermarket',
      destination_iban: null,
      destination_type: 'Expense account',
      budget_id: '1',
      budget_name: 'Groceries',
      category_id: '1',
      category_name: 'Food',
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

    it('should return false when no exclusion options are set', () => {
      const options: SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      expect(shouldExcludeTransaction(mockSplit, options)).toBe(false);
    });

    it('should exclude when source account matches excludeAccounts', () => {
      const options: SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        excludeAccounts: ['Checking Account'],
      };

      expect(shouldExcludeTransaction(mockSplit, options)).toBe(true);
    });

    it('should exclude when destination account matches excludeAccounts', () => {
      const options: SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        excludeAccounts: ['Supermarket'],
      };

      expect(shouldExcludeTransaction(mockSplit, options)).toBe(true);
    });

    it('should not exclude when neither account matches excludeAccounts', () => {
      const options: SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        excludeAccounts: ['Other Account'],
      };

      expect(shouldExcludeTransaction(mockSplit, options)).toBe(false);
    });

    it('should exclude when category matches excludeCategories', () => {
      const options: SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        excludeCategories: ['Food'],
      };

      expect(shouldExcludeTransaction(mockSplit, options)).toBe(true);
    });

    it('should not exclude when transaction has no category', () => {
      const splitNoCategory = { ...mockSplit, category_name: null };
      const options: SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        excludeCategories: ['Food'],
      };

      expect(shouldExcludeTransaction(splitNoCategory, options)).toBe(false);
    });

    it('should exclude when budget matches excludeBudgets', () => {
      const options: SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        excludeBudgets: ['Groceries'],
      };

      expect(shouldExcludeTransaction(mockSplit, options)).toBe(true);
    });

    it('should not exclude when transaction has no budget', () => {
      const splitNoBudget = { ...mockSplit, budget_name: null };
      const options: SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        excludeBudgets: ['Groceries'],
      };

      expect(shouldExcludeTransaction(splitNoBudget, options)).toBe(false);
    });

    it('should exclude when multiple exclusion criteria match', () => {
      const options: SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        excludeAccounts: ['Checking Account'],
        excludeCategories: ['Food'],
        excludeBudgets: ['Groceries'],
      };

      expect(shouldExcludeTransaction(mockSplit, options)).toBe(true);
    });

    it('should exclude when any exclusion criterion matches', () => {
      const options: SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        excludeAccounts: ['Other Account'],
        excludeCategories: ['Food'],
        excludeBudgets: ['Other Budget'],
      };

      expect(shouldExcludeTransaction(mockSplit, options)).toBe(true);
    });

    it('should include transaction with matching includeTags', () => {
      const splitWithTags = { ...mockSplit, tags: ['vacation', 'travel'] };
      const options: SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeTags: ['vacation'],
      };

      expect(shouldExcludeTransaction(splitWithTags, options)).toBe(false);
    });

    it('should exclude transaction without matching includeTags', () => {
      const splitWithTags = { ...mockSplit, tags: ['business'] };
      const options: SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeTags: ['vacation', 'travel'],
      };

      expect(shouldExcludeTransaction(splitWithTags, options)).toBe(true);
    });

    it('should exclude transaction with no tags when includeTags is specified', () => {
      const options: SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeTags: ['vacation'],
      };

      expect(shouldExcludeTransaction(mockSplit, options)).toBe(true);
    });

    it('should exclude transaction with matching excludeTags', () => {
      const splitWithTags = { ...mockSplit, tags: ['internal', 'transfer'] };
      const options: SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        excludeTags: ['internal'],
      };

      expect(shouldExcludeTransaction(splitWithTags, options)).toBe(true);
    });

    it('should not exclude transaction without matching excludeTags', () => {
      const splitWithTags = { ...mockSplit, tags: ['vacation'] };
      const options: SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        excludeTags: ['internal', 'reimbursement'],
      };

      expect(shouldExcludeTransaction(splitWithTags, options)).toBe(false);
    });

    it('should handle both includeTags and excludeTags together', () => {
      const splitWithTags = { ...mockSplit, tags: ['business', 'travel'] };
      const options: SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeTags: ['business'],
        excludeTags: ['reimbursed'],
      };

      // Has business tag (included) and no reimbursed tag (not excluded)
      expect(shouldExcludeTransaction(splitWithTags, options)).toBe(false);
    });

    it('should exclude when transaction has both included and excluded tags', () => {
      const splitWithTags = { ...mockSplit, tags: ['business', 'reimbursed'] };
      const options: SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeTags: ['business'],
        excludeTags: ['reimbursed'],
      };

      // Has business tag (included) but also has reimbursed tag (excluded)
      expect(shouldExcludeTransaction(splitWithTags, options)).toBe(true);
    });

    it('should not exclude when transaction with tags has empty includeTags and excludeTags', () => {
      const splitWithTags = { ...mockSplit, tags: ['some-tag'] };
      const options: SankeyProcessorOptions = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeTags: [],
        excludeTags: [],
      };

      expect(shouldExcludeTransaction(splitWithTags, options)).toBe(false);
    });
  });

  describe('filterAccountsByAmount', () => {
    it('should filter out revenue accounts below minimum amount', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'High Revenue', type: 'revenue' },
        { id: 1, name: 'Low Revenue', type: 'revenue' },
        { id: 2, name: 'All Funds', type: 'asset' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 2, value: 1000, currency: 'USD' },
        { source: 1, target: 2, value: 50, currency: 'USD' },
      ];

      const result = filterAccountsByAmount(nodes, links, 100);

      expect(result.nodes).toHaveLength(2);
      expect(result.links).toHaveLength(1);
      expect(result.nodes.find(n => n.name === 'High Revenue')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Low Revenue')).toBeUndefined();
    });

    it('should filter out expense accounts below minimum amount', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'All Funds', type: 'asset' },
        { id: 1, name: 'High Expense', type: 'expense' },
        { id: 2, name: 'Low Expense', type: 'expense' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 1, value: 500, currency: 'USD' },
        { source: 0, target: 2, value: 25, currency: 'USD' },
      ];

      const result = filterAccountsByAmount(nodes, links, 100);

      expect(result.nodes).toHaveLength(2);
      expect(result.links).toHaveLength(1);
      expect(result.nodes.find(n => n.name === 'High Expense')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Low Expense')).toBeUndefined();
    });

    it('should keep non-account nodes (categories, budgets, assets)', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'Revenue', type: 'revenue' },
        { id: 1, name: 'Category', type: 'category' },
        { id: 2, name: 'All Funds', type: 'asset' },
        { id: 3, name: 'Budget', type: 'budget' },
        { id: 4, name: 'Expense', type: 'expense' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 1, value: 10, currency: 'USD' },
        { source: 1, target: 2, value: 10, currency: 'USD' },
        { source: 2, target: 3, value: 10, currency: 'USD' },
        { source: 3, target: 4, value: 10, currency: 'USD' },
      ];

      const result = filterAccountsByAmount(nodes, links, 100);

      // Revenue and Expense should be filtered (both < 100)
      // But Category, Budget, and All Funds should remain
      expect(result.nodes.find(n => n.name === 'Category')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'Budget')).toBeDefined();
      expect(result.nodes.find(n => n.name === 'All Funds')).toBeDefined();
    });

    it('should sum multiple flows to the same account', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'Revenue', type: 'revenue' },
        { id: 1, name: 'Target 1', type: 'asset' },
        { id: 2, name: 'Target 2', type: 'asset' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 1, value: 40, currency: 'USD' },
        { source: 0, target: 2, value: 70, currency: 'USD' },
      ];

      // Total for revenue account: 40 + 70 = 110, should not be filtered
      const result = filterAccountsByAmount(nodes, links, 100);

      expect(result.nodes.find(n => n.name === 'Revenue')).toBeDefined();
      expect(result.links).toHaveLength(2);
    });

    it('should remap node IDs to be sequential', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'Revenue 1', type: 'revenue' },
        { id: 1, name: 'Revenue 2', type: 'revenue' },
        { id: 2, name: 'All Funds', type: 'asset' },
        { id: 3, name: 'Expense', type: 'expense' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 2, value: 200, currency: 'USD' },
        { source: 1, target: 2, value: 50, currency: 'USD' }, // Will be filtered
        { source: 2, target: 3, value: 200, currency: 'USD' },
      ];

      const result = filterAccountsByAmount(nodes, links, 100);

      // Nodes should be remapped: 0 (Revenue 1), 1 (All Funds), 2 (Expense)
      expect(result.nodes).toHaveLength(3);
      expect(result.nodes[0].id).toBe(0);
      expect(result.nodes[1].id).toBe(1);
      expect(result.nodes[2].id).toBe(2);
    });

    it('should update link references to use new node IDs', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'Revenue 1', type: 'revenue' },
        { id: 1, name: 'Revenue 2', type: 'revenue' },
        { id: 2, name: 'All Funds', type: 'asset' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 2, value: 200, currency: 'USD' },
        { source: 1, target: 2, value: 50, currency: 'USD' }, // Will be filtered
      ];

      const result = filterAccountsByAmount(nodes, links, 100);

      // After filtering and remapping: Revenue 1 = 0, All Funds = 1
      expect(result.links).toHaveLength(1);
      expect(result.links[0].source).toBe(0);
      expect(result.links[0].target).toBe(1);
    });

    it('should return unchanged data when no accounts are filtered', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'Revenue', type: 'revenue' },
        { id: 1, name: 'All Funds', type: 'asset' },
        { id: 2, name: 'Expense', type: 'expense' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 1, value: 200, currency: 'USD' },
        { source: 1, target: 2, value: 200, currency: 'USD' },
      ];

      const result = filterAccountsByAmount(nodes, links, 100);

      expect(result.nodes).toHaveLength(3);
      expect(result.links).toHaveLength(2);
    });

    it('should handle empty nodes and links', () => {
      const result = filterAccountsByAmount([], [], 100);

      expect(result.nodes).toHaveLength(0);
      expect(result.links).toHaveLength(0);
    });

    it('should preserve link properties other than node references', () => {
      const nodes: SankeyNode[] = [
        { id: 0, name: 'Revenue', type: 'revenue' },
        { id: 1, name: 'All Funds', type: 'asset' },
      ];

      const links: SankeyLink[] = [
        { source: 0, target: 1, value: 123.45, currency: 'EUR' },
      ];

      const result = filterAccountsByAmount(nodes, links, 100);

      expect(result.links[0].value).toBe(123.45);
      expect(result.links[0].currency).toBe('EUR');
    });
  });
});
