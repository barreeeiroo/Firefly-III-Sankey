/**
 * Firefly III API Client
 */

import { FireflyClientConfig } from './base-client';
import { AboutClient } from './about';
import { TransactionsClient } from './transactions';

export * from './base-client';
export * from './about';
export * from './transactions';

/**
 * Main Firefly III API Client
 * Provides access to all API endpoints through specialized clients
 */
export class FireflyClient {
  private aboutClient: AboutClient;
  private transactionsClient: TransactionsClient;

  constructor(config: FireflyClientConfig) {
    this.aboutClient = new AboutClient(config);
    this.transactionsClient = new TransactionsClient(config);
  }

  /**
   * Get system information
   */
  async getAbout() {
    return this.aboutClient.getAbout();
  }

  /**
   * Get authenticated user information
   */
  async getAboutUser() {
    return this.aboutClient.getAboutUser();
  }

  /**
   * Get transactions client for transaction-related operations
   */
  get transactions() {
    return this.transactionsClient;
  }
}
