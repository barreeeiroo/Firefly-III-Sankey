import * as ModelsExports from '../../src/models';

describe('Models index exports', () => {
  describe('About models', () => {
    it('should export About-related types', () => {
      // TypeScript types are verified at compile time
      // We just ensure the module loads without errors
      expect(ModelsExports).toBeDefined();
    });

    it('should allow type usage for FireflyAboutResponse', () => {
      const mockAbout: ModelsExports.FireflyAboutResponse = {
        data: {
          version: '6.1.22',
          api_version: '2.0.14',
          os: 'Linux',
          php_version: '8.2.0',
        },
      };

      expect(mockAbout.data.version).toBe('6.1.22');
      expect(mockAbout.data.api_version).toBe('2.0.14');
    });

    it('should allow type usage for FireflyUserResponse', () => {
      const mockUser: ModelsExports.FireflyUserResponse = {
        data: {
          type: 'users',
          id: '1',
          attributes: {
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            email: 'test@example.com',
            blocked: false,
            role: 'owner',
          },
        },
      };

      expect(mockUser.data.attributes.email).toBe('test@example.com');
      expect(mockUser.data.attributes.blocked).toBe(false);
    });
  });

  describe('Transaction models', () => {
    it('should allow type usage for Transaction', () => {
      const mockTransaction: ModelsExports.Transaction = {
        type: 'transactions',
        id: '123',
        attributes: {
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          user: '1',
          group_title: null,
          transactions: [],
        },
        links: {
          self: 'http://example.com/api/v1/transactions/123',
        },
      };

      expect(mockTransaction.id).toBe('123');
      expect(mockTransaction.type).toBe('transactions');
    });

    it('should allow type usage for TransactionSplit', () => {
      const mockSplit: ModelsExports.TransactionSplit = {
        user: '1',
        transaction_journal_id: '456',
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

      expect(mockSplit.type).toBe('withdrawal');
      expect(mockSplit.amount).toBe('100.00');
      expect(mockSplit.currency_code).toBe('USD');
    });

    it('should allow type usage for TransactionListResponse', () => {
      const mockResponse: ModelsExports.TransactionListResponse = {
        data: [],
        meta: {
          pagination: {
            total: 0,
            count: 0,
            per_page: 50,
            current_page: 1,
            total_pages: 1,
          },
        },
        links: {
          self: 'http://example.com',
          first: 'http://example.com',
          last: 'http://example.com',
        },
      };

      expect(mockResponse.data).toEqual([]);
      expect(mockResponse.meta.pagination.total).toBe(0);
    });

    it('should allow type usage for InsightGroup', () => {
      const mockInsightGroup: ModelsExports.InsightGroup = {
        id: '1',
        name: 'Store',
        difference: '100.50',
        difference_float: 100.5,
        currency_id: '1',
        currency_code: 'USD',
      };

      expect(mockInsightGroup.name).toBe('Store');
      expect(mockInsightGroup.difference_float).toBe(100.5);
    });

    it('should allow type usage for InsightPeriod', () => {
      const mockPeriod: ModelsExports.InsightPeriod = {
        '2024-01-01': [
          {
            id: '1',
            name: 'Store',
            difference: '100.50',
            difference_float: 100.5,
            currency_id: '1',
            currency_code: 'USD',
          },
        ],
      };

      expect(mockPeriod['2024-01-01']).toHaveLength(1);
      expect(mockPeriod['2024-01-01'][0].name).toBe('Store');
    });

    it('should allow type usage for InsightResponse', () => {
      const mockInsight: ModelsExports.InsightResponse = {
        data: [
          {
            '2024-01-01': [
              {
                id: '1',
                name: 'Store',
                difference: '100.50',
                difference_float: 100.5,
                currency_id: '1',
                currency_code: 'USD',
              },
            ],
          },
        ],
      };

      expect(mockInsight.data).toHaveLength(1);
      expect(mockInsight.data[0]['2024-01-01'][0].name).toBe('Store');
    });
  });

  it('should verify the module loads correctly', () => {
    // Models exports only TypeScript types, which don't have runtime representation
    // This test ensures that the index file loads without errors
    // The types are verified at compile time and through the usage tests above
    expect(ModelsExports).toBeDefined();
  });
});
