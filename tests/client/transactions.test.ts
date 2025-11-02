import { TransactionsClient } from '../../src/client/transactions';
import { TransactionListResponse, InsightResponse } from '../../src/models';

describe('TransactionsClient', () => {
  let client: TransactionsClient;
  const mockFetch = jest.fn();

  beforeAll(() => {
    global.fetch = mockFetch;
  });

  beforeEach(() => {
    mockFetch.mockClear();
    client = new TransactionsClient({
      baseUrl: 'https://firefly.example.com',
      token: 'test-token-123',
    });
  });

  describe('listTransactions', () => {
    it('should list transactions without parameters', async () => {
      const mockResponse: TransactionListResponse = {
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.listTransactions();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://firefly.example.com/api/v1/transactions',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should list transactions with all parameters', async () => {
      const mockResponse: TransactionListResponse = {
        data: [],
        meta: {
          pagination: {
            total: 100,
            count: 10,
            per_page: 10,
            current_page: 2,
            total_pages: 10,
          },
        },
        links: {
          self: 'http://example.com',
          first: 'http://example.com',
          last: 'http://example.com',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.listTransactions({
        start: '2024-01-01',
        end: '2024-12-31',
        type: 'withdrawal',
        page: 2,
        limit: 10,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://firefly.example.com/api/v1/transactions?start=2024-01-01&end=2024-12-31&type=withdrawal&page=2&limit=10',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle partial parameters', async () => {
      const mockResponse: TransactionListResponse = {
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.listTransactions({
        start: '2024-01-01',
        type: 'deposit',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://firefly.example.com/api/v1/transactions?start=2024-01-01&type=deposit',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('getExpenseInsights', () => {
    it('should get expense insights without account filter', async () => {
      const mockResponse: InsightResponse = {
        data: [
          {
            '2024-01-01': [
              {
                id: '1',
                name: 'Supermarket',
                difference: '100.00',
                difference_float: 100.0,
                currency_id: '1',
                currency_code: 'USD',
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getExpenseInsights({
        start: '2024-01-01',
        end: '2024-01-31',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://firefly.example.com/api/v1/insight/expense/expense?start=2024-01-01&end=2024-01-31',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get expense insights with account filter', async () => {
      const mockResponse: InsightResponse = {
        data: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.getExpenseInsights({
        start: '2024-01-01',
        end: '2024-01-31',
        accounts: ['1', '2', '3'],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://firefly.example.com/api/v1/insight/expense/expense?start=2024-01-01&end=2024-01-31&accounts%5B%5D=1&accounts%5B%5D=2&accounts%5B%5D=3',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('getExpenseByAsset', () => {
    it('should get expense insights by asset account', async () => {
      const mockResponse: InsightResponse = {
        data: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getExpenseByAsset({
        start: '2024-01-01',
        end: '2024-01-31',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://firefly.example.com/api/v1/insight/expense/asset?start=2024-01-01&end=2024-01-31',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getIncomeInsights', () => {
    it('should get income insights by revenue account', async () => {
      const mockResponse: InsightResponse = {
        data: [
          {
            '2024-01-01': [
              {
                id: '5',
                name: 'Salary',
                difference: '5000.00',
                difference_float: 5000.0,
                currency_id: '1',
                currency_code: 'USD',
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getIncomeInsights({
        start: '2024-01-01',
        end: '2024-01-31',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://firefly.example.com/api/v1/insight/income/revenue?start=2024-01-01&end=2024-01-31',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get income insights with account filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await client.getIncomeInsights({
        start: '2024-01-01',
        end: '2024-01-31',
        accounts: ['10', '11'],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://firefly.example.com/api/v1/insight/income/revenue?start=2024-01-01&end=2024-01-31&accounts%5B%5D=10&accounts%5B%5D=11',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('getIncomeByAsset', () => {
    it('should get income insights by asset account', async () => {
      const mockResponse: InsightResponse = {
        data: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getIncomeByAsset({
        start: '2024-01-01',
        end: '2024-01-31',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://firefly.example.com/api/v1/insight/income/asset?start=2024-01-01&end=2024-01-31',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getTransferInsights', () => {
    it('should get transfer insights', async () => {
      const mockResponse: InsightResponse = {
        data: [
          {
            '2024-01-15': [
              {
                id: '20',
                name: 'Savings Account',
                difference: '1000.00',
                difference_float: 1000.0,
                currency_id: '1',
                currency_code: 'USD',
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getTransferInsights({
        start: '2024-01-01',
        end: '2024-01-31',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://firefly.example.com/api/v1/insight/transfer/asset?start=2024-01-01&end=2024-01-31',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get transfer insights with account filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await client.getTransferInsights({
        start: '2024-01-01',
        end: '2024-01-31',
        accounts: ['20', '21'],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://firefly.example.com/api/v1/insight/transfer/asset?start=2024-01-01&end=2024-01-31&accounts%5B%5D=20&accounts%5B%5D=21',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('getAllTransactions', () => {
    it('should fetch all transactions with pagination', async () => {
      const mockPage1: TransactionListResponse = {
        data: [
          {
            type: 'transactions',
            id: '1',
            attributes: {
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              user: '1',
              group_title: null,
              transactions: [],
            },
            links: { self: 'http://example.com' },
          },
        ],
        meta: {
          pagination: {
            total: 100,
            count: 50,
            per_page: 50,
            current_page: 1,
            total_pages: 2,
          },
        },
        links: {
          self: 'http://example.com',
          first: 'http://example.com',
          last: 'http://example.com',
          next: 'http://example.com?page=2',
        },
      };

      const mockPage2: TransactionListResponse = {
        data: [
          {
            type: 'transactions',
            id: '2',
            attributes: {
              created_at: '2024-01-02T00:00:00Z',
              updated_at: '2024-01-02T00:00:00Z',
              user: '1',
              group_title: null,
              transactions: [],
            },
            links: { self: 'http://example.com' },
          },
        ],
        meta: {
          pagination: {
            total: 100,
            count: 50,
            per_page: 50,
            current_page: 2,
            total_pages: 2,
          },
        },
        links: {
          self: 'http://example.com',
          first: 'http://example.com',
          last: 'http://example.com',
          prev: 'http://example.com?page=1',
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPage1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPage2,
        });

      const result = await client.getAllTransactions({
        start: '2024-01-01',
        end: '2024-01-31',
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('should handle single page response', async () => {
      const mockResponse: TransactionListResponse = {
        data: [
          {
            type: 'transactions',
            id: '1',
            attributes: {
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              user: '1',
              group_title: null,
              transactions: [],
            },
            links: { self: 'http://example.com' },
          },
        ],
        meta: {
          pagination: {
            total: 1,
            count: 1,
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getAllTransactions({
        start: '2024-01-01',
        end: '2024-01-31',
        type: 'withdrawal',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should pass transaction type parameter', async () => {
      const mockResponse: TransactionListResponse = {
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.getAllTransactions({
        start: '2024-01-01',
        end: '2024-01-31',
        type: 'deposit',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('type=deposit'),
        expect.anything()
      );
    });
  });
});
