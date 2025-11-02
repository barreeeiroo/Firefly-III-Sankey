import { AboutClient } from '../../src/client/about';
import { FireflyAboutResponse, FireflyUserResponse } from '../../src/models';

describe('AboutClient', () => {
  let client: AboutClient;
  const mockFetch = jest.fn();

  beforeAll(() => {
    global.fetch = mockFetch;
  });

  beforeEach(() => {
    mockFetch.mockClear();
    client = new AboutClient({
      baseUrl: 'https://firefly.example.com',
      token: 'test-token-123',
    });
  });

  describe('getAbout', () => {
    it('should fetch system information', async () => {
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
      expect(result.data.api_version).toBe('2.0.14');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      });

      await expect(client.getAbout()).rejects.toThrow(
        'Firefly III API error: 500 Internal Server Error - Server error'
      );
    });
  });

  describe('getAboutUser', () => {
    it('should fetch authenticated user information', async () => {
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
      expect(result.data.attributes.blocked).toBe(false);
    });

    it('should handle blocked user', async () => {
      const mockResponse: FireflyUserResponse = {
        data: {
          type: 'users',
          id: '2',
          attributes: {
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            email: 'blocked@example.com',
            blocked: true,
            blocked_code: 'email_changed',
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getAboutUser();

      expect(result.data.attributes.blocked).toBe(true);
      expect(result.data.attributes.blocked_code).toBe('email_changed');
    });

    it('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid token',
      });

      await expect(client.getAboutUser()).rejects.toThrow(
        'Firefly III API error: 401 Unauthorized - Invalid token'
      );
    });
  });
});
