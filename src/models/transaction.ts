/**
 * Firefly III Transaction Models
 */

export interface TransactionAttributes {
  created_at: string;
  updated_at: string;
  user: string;
  group_title: string | null;
  transactions: TransactionSplit[];
}

export interface TransactionSplit {
  user: string;
  transaction_journal_id: string;
  type: 'withdrawal' | 'deposit' | 'transfer';
  date: string;
  order: number;
  currency_id: string;
  currency_code: string;
  currency_symbol: string;
  currency_name: string;
  currency_decimal_places: number;
  foreign_currency_id: string | null;
  foreign_currency_code: string | null;
  foreign_currency_symbol: string | null;
  foreign_currency_decimal_places: number | null;
  amount: string;
  foreign_amount: string | null;
  description: string;
  source_id: string;
  source_name: string;
  source_iban: string | null;
  source_type: string;
  destination_id: string;
  destination_name: string;
  destination_iban: string | null;
  destination_type: string;
  budget_id: string | null;
  budget_name: string | null;
  category_id: string | null;
  category_name: string | null;
  bill_id: string | null;
  bill_name: string | null;
  reconciled: boolean;
  notes: string | null;
  tags: string[];
  internal_reference: string | null;
  external_id: string | null;
  original_source: string | null;
  recurrence_id: string | null;
  recurrence_total: number | null;
  recurrence_count: number | null;
  bunq_payment_id: string | null;
  import_hash_v2: string | null;
  sepa_cc: string | null;
  sepa_ct_op: string | null;
  sepa_ct_id: string | null;
  sepa_db: string | null;
  sepa_country: string | null;
  sepa_ep: string | null;
  sepa_ci: string | null;
  sepa_batch_id: string | null;
  interest_date: string | null;
  book_date: string | null;
  process_date: string | null;
  due_date: string | null;
  payment_date: string | null;
  invoice_date: string | null;
  latitude: number | null;
  longitude: number | null;
  zoom_level: number | null;
  has_attachments: boolean;
}

export interface Transaction {
  type: 'transactions';
  id: string;
  attributes: TransactionAttributes;
  links: {
    self: string;
  };
}

export interface TransactionListResponse {
  data: Transaction[];
  meta: {
    pagination: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
    };
  };
  links: {
    self: string;
    first: string;
    last: string;
    prev?: string;
    next?: string;
  };
}

export interface InsightGroup {
  id: string;
  name: string;
  difference: string;
  difference_float: number;
  currency_id: string;
  currency_code: string;
}

export interface InsightTotal {
  difference: string;
  difference_float: number;
  currency_id: string;
  currency_code: string;
}

export interface InsightPeriod {
  [key: string]: InsightGroup[];
}

export interface InsightResponse {
  data: InsightPeriod[];
}
