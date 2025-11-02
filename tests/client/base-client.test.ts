import { BaseFireflyClient } from '../../src/client/base-client';

// Create a test subclass to access protected methods
class TestFireflyClient extends BaseFireflyClient {
  public testGet<T>(path: string): Promise<T> {
    return this.get<T>(path);
  }

  public testPost<T>(path: string, data?: unknown): Promise<T> {
    return this.post<T>(path, data);
  }

  public testPut<T>(path: string, data?: unknown): Promise<T> {
    return this.put<T>(path, data);
  }

  public testDelete<T>(path: string): Promise<T> {
    return this.delete<T>(path);
  }

  public getApiEndpoint(): string {
    return this.apiEndpoint;
  }

  public getToken(): string {
    return this.token;
  }
}

describe('BaseFireflyClient', () => {
  let client: TestFireflyClient;
  const mockFetch = jest.fn();

  beforeAll(() => {
    global.fetch = mockFetch;
  });

  beforeEach(() => {
    mockFetch.mockClear();
    client = new TestFireflyClient({
      baseUrl: 'https://firefly.example.com',
      token: 'test-token-123',
    });
  });

  describe('constructor', () => {
    it('should set up API endpoint correctly', () => {
      expect(client.getApiEndpoint()).toBe('https://firefly.example.com/api');
    });

    it('should remove trailing slash from base URL', () => {
      const clientWithSlash = new TestFireflyClient({
        baseUrl: 'https://firefly.example.com/',
        token: 'test-token',
      });
      expect(clientWithSlash.getApiEndpoint()).toBe('https://firefly.example.com/api');
    });

    it('should store the token', () => {
      expect(client.getToken()).toBe('test-token-123');
    });
  });

  describe('GET requests', () => {
    it('should make a successful GET request', async () => {
      const mockData = { data: { version: '1.0.0' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await client.testGet('/v1/about');

      expect(mockFetch).toHaveBeenCalledWith('https://firefly.example.com/api/v1/about', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token-123',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockData);
    });

    it('should throw error on failed GET request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid token',
      });

      await expect(client.testGet('/v1/about')).rejects.toThrow(
        'Firefly III API error: 401 Unauthorized - Invalid token'
      );
    });
  });

  describe('POST requests', () => {
    it('should make a successful POST request with data', async () => {
      const mockData = { data: { id: '123' } };
      const postData = { name: 'Test' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await client.testPost('/v1/test', postData);

      expect(mockFetch).toHaveBeenCalledWith('https://firefly.example.com/api/v1/test', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token-123',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
      expect(result).toEqual(mockData);
    });

    it('should make a successful POST request without data', async () => {
      const mockData = { data: { success: true } };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await client.testPost('/v1/test');

      expect(mockFetch).toHaveBeenCalledWith('https://firefly.example.com/api/v1/test', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token-123',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: undefined,
      });
    });

    it('should throw error on failed POST request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        text: async () => 'Validation failed',
      });

      await expect(client.testPost('/v1/test', { name: 'Test' })).rejects.toThrow(
        'Firefly III API error: 422 Unprocessable Entity - Validation failed'
      );
    });
  });

  describe('PUT requests', () => {
    it('should make a successful PUT request with data', async () => {
      const mockData = { data: { id: '123', updated: true } };
      const putData = { name: 'Updated' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await client.testPut('/v1/test/123', putData);

      expect(mockFetch).toHaveBeenCalledWith('https://firefly.example.com/api/v1/test/123', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer test-token-123',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(putData),
      });
      expect(result).toEqual(mockData);
    });

    it('should make a successful PUT request without data', async () => {
      const mockData = { data: { success: true } };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await client.testPut('/v1/test/123');

      expect(mockFetch).toHaveBeenCalledWith('https://firefly.example.com/api/v1/test/123', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer test-token-123',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: undefined,
      });
    });

    it('should throw error on failed PUT request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Resource not found',
      });

      await expect(client.testPut('/v1/test/999', { name: 'Test' })).rejects.toThrow(
        'Firefly III API error: 404 Not Found - Resource not found'
      );
    });
  });

  describe('DELETE requests', () => {
    it('should make a successful DELETE request', async () => {
      const mockData = { data: { deleted: true } };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await client.testDelete('/v1/test/123');

      expect(mockFetch).toHaveBeenCalledWith('https://firefly.example.com/api/v1/test/123', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer test-token-123',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockData);
    });

    it('should throw error on failed DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Access denied',
      });

      await expect(client.testDelete('/v1/test/123')).rejects.toThrow(
        'Firefly III API error: 403 Forbidden - Access denied'
      );
    });
  });
});
