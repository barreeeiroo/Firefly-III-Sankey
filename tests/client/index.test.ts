import { FireflyClient } from '../../src/client';
import { FireflyAboutResponse, FireflyUserResponse } from '../../src/models';

describe('FireflyClient', () => {
  let client: FireflyClient;
  const mockFetch = jest.fn();

  beforeAll(() => {
    global.fetch = mockFetch;
  });

  beforeEach(() => {
    mockFetch.mockClear();
    client = new FireflyClient({
      baseUrl: 'https://firefly.example.com',
      token: 'test-token-123',
    });
  });

  describe('constructor', () => {
    it('should create a new FireflyClient instance', () => {
      expect(client).toBeInstanceOf(FireflyClient);
    });

    it('should initialize with correct configuration', () => {
      const newClient = new FireflyClient({
        baseUrl: 'https://test.example.com/',
        token: 'another-token',
      });
      expect(newClient).toBeInstanceOf(FireflyClient);
    });
  });

  describe('getAbout', () => {
    it('should delegate to AboutClient.getAbout', async () => {
      const mockResponse: FireflyAboutResponse = {
        data: {
          version: '6.3.0',
          api_version: '2.0.14',
          os: 'Linux',
          php_version: '8.2.0',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getAbout();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://firefly.example.com/api/v1/about',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
      expect(result.data.version).toBe('6.3.0');
    });

    it('should handle errors from AboutClient', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: async () => 'Service temporarily unavailable',
      });

      await expect(client.getAbout()).rejects.toThrow(
        'Firefly III API error: 503 Service Unavailable - Service temporarily unavailable'
      );
    });
  });

  describe('getAboutUser', () => {
    it('should delegate to AboutClient.getAboutUser', async () => {
      const mockResponse: FireflyUserResponse = {
        data: {
          type: 'users',
          id: '1',
          attributes: {
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            email: 'user@example.com',
            blocked: false,
            role: 'owner',
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getAboutUser();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://firefly.example.com/api/v1/about/user',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
      expect(result.data.attributes.email).toBe('user@example.com');
    });

    it('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid or expired token',
      });

      await expect(client.getAboutUser()).rejects.toThrow(
        'Firefly III API error: 401 Unauthorized - Invalid or expired token'
      );
    });
  });

  describe('transactions getter', () => {
    it('should return TransactionsClient instance', () => {
      const transactionsClient = client.transactions;
      expect(transactionsClient).toBeDefined();
      expect(typeof transactionsClient.listTransactions).toBe('function');
      expect(typeof transactionsClient.getAllTransactions).toBe('function');
      expect(typeof transactionsClient.getExpenseInsights).toBe('function');
      expect(typeof transactionsClient.getIncomeInsights).toBe('function');
      expect(typeof transactionsClient.getTransferInsights).toBe('function');
    });

    it('should return the same TransactionsClient instance on multiple calls', () => {
      const transactionsClient1 = client.transactions;
      const transactionsClient2 = client.transactions;
      expect(transactionsClient1).toBe(transactionsClient2);
    });

    it('should allow chaining transactions methods', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
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
        }),
      });

      const result = await client.transactions.listTransactions({
        start: '2024-01-01',
        end: '2024-01-31',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/transactions'),
        expect.anything()
      );
      expect(result.data).toEqual([]);
    });
  });

  describe('integration', () => {
    it('should handle multiple sequential calls', async () => {
      const mockAboutResponse: FireflyAboutResponse = {
        data: {
          version: '6.3.0',
          api_version: '2.0.14',
          os: 'Linux',
          php_version: '8.2.0',
        },
      };

      const mockUserResponse: FireflyUserResponse = {
        data: {
          type: 'users',
          id: '1',
          attributes: {
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            email: 'user@example.com',
            blocked: false,
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAboutResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUserResponse,
        });

      const aboutResult = await client.getAbout();
      const userResult = await client.getAboutUser();

      expect(aboutResult.data.version).toBe('6.3.0');
      expect(userResult.data.attributes.email).toBe('user@example.com');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should maintain separate client instances with different configs', async () => {
      const client1 = new FireflyClient({
        baseUrl: 'https://firefly1.example.com',
        token: 'token1',
      });

      const client2 = new FireflyClient({
        baseUrl: 'https://firefly2.example.com',
        token: 'token2',
      });

      const mockResponse: FireflyAboutResponse = {
        data: {
          version: '6.3.0',
          api_version: '2.0.14',
          os: 'Linux',
          php_version: '8.2.0',
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await client1.getAbout();
      await client2.getAbout();

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://firefly1.example.com/api/v1/about',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token1',
          }),
        })
      );

      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://firefly2.example.com/api/v1/about',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token2',
          }),
        })
      );
    });
  });
});
