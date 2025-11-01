/**
 * Transactions API Client
 */

import { BaseFireflyClient } from './base-client';
import { TransactionListResponse, InsightResponse } from '../models';

export class TransactionsClient extends BaseFireflyClient {
  /**
   * List all transactions with optional filters
   */
  async listTransactions(params: {
    start?: string;
    end?: string;
    type?: 'withdrawal' | 'deposit' | 'transfer' | 'all';
    page?: number;
    limit?: number;
  } = {}): Promise<TransactionListResponse> {
    const queryParams = new URLSearchParams();

    if (params.start) queryParams.append('start', params.start);
    if (params.end) queryParams.append('end', params.end);
    if (params.type) queryParams.append('type', params.type);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const path = `/v1/transactions${query ? `?${query}` : ''}`;

    return this.get<TransactionListResponse>(path);
  }

  /**
   * Get expense insights grouped by expense account
   */
  async getExpenseInsights(params: {
    start: string;
    end: string;
    accounts?: string[];
  }): Promise<InsightResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('start', params.start);
    queryParams.append('end', params.end);

    if (params.accounts && params.accounts.length > 0) {
      params.accounts.forEach(id => queryParams.append('accounts[]', id));
    }

    return this.get<InsightResponse>(`/v1/insight/expense/expense?${queryParams.toString()}`);
  }

  /**
   * Get expense insights grouped by asset account
   */
  async getExpenseByAsset(params: {
    start: string;
    end: string;
    accounts?: string[];
  }): Promise<InsightResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('start', params.start);
    queryParams.append('end', params.end);

    if (params.accounts && params.accounts.length > 0) {
      params.accounts.forEach(id => queryParams.append('accounts[]', id));
    }

    return this.get<InsightResponse>(`/v1/insight/expense/asset?${queryParams.toString()}`);
  }

  /**
   * Get income insights grouped by revenue account
   */
  async getIncomeInsights(params: {
    start: string;
    end: string;
    accounts?: string[];
  }): Promise<InsightResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('start', params.start);
    queryParams.append('end', params.end);

    if (params.accounts && params.accounts.length > 0) {
      params.accounts.forEach(id => queryParams.append('accounts[]', id));
    }

    return this.get<InsightResponse>(`/v1/insight/income/revenue?${queryParams.toString()}`);
  }

  /**
   * Get income insights grouped by asset account
   */
  async getIncomeByAsset(params: {
    start: string;
    end: string;
    accounts?: string[];
  }): Promise<InsightResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('start', params.start);
    queryParams.append('end', params.end);

    if (params.accounts && params.accounts.length > 0) {
      params.accounts.forEach(id => queryParams.append('accounts[]', id));
    }

    return this.get<InsightResponse>(`/v1/insight/income/asset?${queryParams.toString()}`);
  }

  /**
   * Get transfer insights grouped by asset account
   */
  async getTransferInsights(params: {
    start: string;
    end: string;
    accounts?: string[];
  }): Promise<InsightResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('start', params.start);
    queryParams.append('end', params.end);

    if (params.accounts && params.accounts.length > 0) {
      params.accounts.forEach(id => queryParams.append('accounts[]', id));
    }

    return this.get<InsightResponse>(`/v1/insight/transfer/asset?${queryParams.toString()}`);
  }

  /**
   * Get all transactions within a date range (handles pagination automatically)
   */
  async getAllTransactions(params: {
    start: string;
    end: string;
    type?: 'withdrawal' | 'deposit' | 'transfer' | 'all';
  }) {
    const allTransactions = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.listTransactions({
        ...params,
        page,
        limit: 50,
      });

      allTransactions.push(...response.data);

      hasMore = page < response.meta.pagination.total_pages;
      page++;
    }

    return allTransactions;
  }
}
