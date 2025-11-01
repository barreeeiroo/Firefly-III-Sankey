/**
 * Base Firefly III API Client
 */

export interface FireflyClientConfig {
  baseUrl: string;
  token: string;
}

export class BaseFireflyClient {
  protected readonly apiEndpoint: string;
  protected readonly token: string;

  constructor(config: FireflyClientConfig) {
    // Remove trailing slash from base URL and append /api
    this.apiEndpoint = config.baseUrl.replace(/\/$/, '') + '/api';
    this.token = config.token;
  }

  /**
   * Make a GET request to the Firefly III API
   */
  protected async get<T>(path: string): Promise<T> {
    const url = `${this.apiEndpoint}${path}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firefly III API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Make a POST request to the Firefly III API
   */
  protected async post<T>(path: string, data?: unknown): Promise<T> {
    const url = `${this.apiEndpoint}${path}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firefly III API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Make a PUT request to the Firefly III API
   */
  protected async put<T>(path: string, data?: unknown): Promise<T> {
    const url = `${this.apiEndpoint}${path}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firefly III API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Make a DELETE request to the Firefly III API
   */
  protected async delete<T>(path: string): Promise<T> {
    const url = `${this.apiEndpoint}${path}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firefly III API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json() as Promise<T>;
  }
}
