/**
 * Capital One Nessie API Client
 * Sandbox API for banking data integration
 */

const NESSIE_BASE_URL = 'http://api.nessieisreal.com';

// Get API key from environment
function getApiKey(): string {
  const apiKey = process.env.CAPITAL_ONE_API_KEY;
  if (!apiKey) {
    throw new Error('CAPITAL_ONE_API_KEY is not configured');
  }
  return apiKey.trim();
}

// Build URL with API key
function buildUrl(endpoint: string, params: Record<string, string> = {}): string {
  const url = new URL(`${NESSIE_BASE_URL}${endpoint}`);
  url.searchParams.set('key', getApiKey());
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

// Generic fetch wrapper with error handling
async function nessieRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = buildUrl(endpoint);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Nessie API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Customer {
  _id: string;
  first_name: string;
  last_name: string;
  address: {
    street_number: string;
    street_name: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface Account {
  _id: string;
  type: 'Checking' | 'Savings' | 'Credit Card';
  nickname: string;
  rewards: number;
  balance: number;
  customer_id: string;
}

export interface Purchase {
  _id: string;
  type: 'purchase';
  merchant_id: string;
  payer_id: string;
  purchase_date: string;
  amount: number;
  status: 'pending' | 'cancelled' | 'completed';
  medium: 'balance' | 'rewards';
  description: string;
}

export interface Deposit {
  _id: string;
  type: 'deposit';
  transaction_date: string;
  status: 'pending' | 'cancelled' | 'completed';
  medium: 'balance' | 'rewards';
  amount: number;
  description: string;
}

export interface Withdrawal {
  _id: string;
  type: 'withdrawal';
  transaction_date: string;
  status: 'pending' | 'cancelled' | 'completed';
  medium: 'balance' | 'rewards';
  amount: number;
  description: string;
}

export interface Transfer {
  _id: string;
  type: 'transfer';
  transaction_date: string;
  status: 'pending' | 'cancelled' | 'completed';
  medium: 'balance' | 'rewards';
  payer_id: string;
  payee_id: string;
  amount: number;
  description: string;
}

export interface Merchant {
  _id: string;
  name: string;
  category: string[];
  address: {
    street_number: string;
    street_name: string;
    city: string;
    state: string;
    zip: string;
  };
  geocode: {
    lat: number;
    lng: number;
  };
}

export interface Bill {
  _id: string;
  status: 'pending' | 'cancelled' | 'completed' | 'recurring';
  payee: string;
  nickname: string;
  creation_date: string;
  payment_date: string;
  recurring_date: number;
  upcoming_payment_date: string;
  payment_amount: number;
  account_id: string;
}

export type Transaction = Purchase | Deposit | Withdrawal | Transfer;

// ============================================
// API METHODS
// ============================================

/**
 * Get all customers (sandbox has pre-created test customers)
 */
export async function getCustomers(): Promise<Customer[]> {
  return nessieRequest<Customer[]>('/customers');
}

/**
 * Get a specific customer by ID
 */
export async function getCustomer(customerId: string): Promise<Customer> {
  return nessieRequest<Customer>(`/customers/${customerId}`);
}

/**
 * Get all accounts for a customer
 */
export async function getCustomerAccounts(customerId: string): Promise<Account[]> {
  return nessieRequest<Account[]>(`/customers/${customerId}/accounts`);
}

/**
 * Get a specific account by ID
 */
export async function getAccount(accountId: string): Promise<Account> {
  return nessieRequest<Account>(`/accounts/${accountId}`);
}

/**
 * Get all accounts (across all customers)
 */
export async function getAllAccounts(): Promise<Account[]> {
  return nessieRequest<Account[]>('/accounts');
}

/**
 * Get purchases for an account
 */
export async function getAccountPurchases(accountId: string): Promise<Purchase[]> {
  return nessieRequest<Purchase[]>(`/accounts/${accountId}/purchases`);
}

/**
 * Get deposits for an account
 */
export async function getAccountDeposits(accountId: string): Promise<Deposit[]> {
  return nessieRequest<Deposit[]>(`/accounts/${accountId}/deposits`);
}

/**
 * Get withdrawals for an account
 */
export async function getAccountWithdrawals(accountId: string): Promise<Withdrawal[]> {
  return nessieRequest<Withdrawal[]>(`/accounts/${accountId}/withdrawals`);
}

/**
 * Get transfers for an account
 */
export async function getAccountTransfers(accountId: string): Promise<Transfer[]> {
  return nessieRequest<Transfer[]>(`/accounts/${accountId}/transfers`);
}

/**
 * Get all transactions for an account (purchases, deposits, withdrawals)
 */
export async function getAccountTransactions(accountId: string): Promise<Transaction[]> {
  const [purchases, deposits, withdrawals, transfers] = await Promise.all([
    getAccountPurchases(accountId).catch(() => []),
    getAccountDeposits(accountId).catch(() => []),
    getAccountWithdrawals(accountId).catch(() => []),
    getAccountTransfers(accountId).catch(() => []),
  ]);

  return [...purchases, ...deposits, ...withdrawals, ...transfers];
}

/**
 * Get merchant details
 */
export async function getMerchant(merchantId: string): Promise<Merchant> {
  return nessieRequest<Merchant>(`/merchants/${merchantId}`);
}

/**
 * Get all merchants
 */
export async function getAllMerchants(): Promise<Merchant[]> {
  return nessieRequest<Merchant[]>('/merchants');
}

/**
 * Get bills for an account
 */
export async function getAccountBills(accountId: string): Promise<Bill[]> {
  return nessieRequest<Bill[]>(`/accounts/${accountId}/bills`);
}

// ============================================
// SANDBOX DATA CREATION (for testing)
// ============================================

/**
 * Create a new customer in the sandbox
 */
export async function createCustomer(data: {
  first_name: string;
  last_name: string;
  address: {
    street_number: string;
    street_name: string;
    city: string;
    state: string;
    zip: string;
  };
}): Promise<{ objectCreated: Customer; code: number }> {
  return nessieRequest('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Create an account for a customer
 */
export async function createAccount(
  customerId: string,
  data: {
    type: 'Checking' | 'Savings' | 'Credit Card';
    nickname: string;
    rewards: number;
    balance: number;
  }
): Promise<{ objectCreated: Account; code: number }> {
  return nessieRequest(`/customers/${customerId}/accounts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Create a purchase for an account
 */
export async function createPurchase(
  accountId: string,
  data: {
    merchant_id: string;
    medium: 'balance' | 'rewards';
    purchase_date: string;
    amount: number;
    description: string;
  }
): Promise<{ objectCreated: Purchase; code: number }> {
  return nessieRequest(`/accounts/${accountId}/purchases`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Create a deposit for an account
 */
export async function createDeposit(
  accountId: string,
  data: {
    medium: 'balance' | 'rewards';
    transaction_date: string;
    amount: number;
    description: string;
  }
): Promise<{ objectCreated: Deposit; code: number }> {
  return nessieRequest(`/accounts/${accountId}/deposits`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get total balance across all accounts for a customer
 */
export async function getCustomerTotalBalance(customerId: string): Promise<number> {
  const accounts = await getCustomerAccounts(customerId);
  return accounts.reduce((total, account) => total + account.balance, 0);
}

/**
 * Get spending summary for an account
 */
export async function getAccountSpendingSummary(accountId: string): Promise<{
  totalSpent: number;
  totalDeposited: number;
  totalWithdrawn: number;
  netChange: number;
  transactionCount: number;
}> {
  const [purchases, deposits, withdrawals] = await Promise.all([
    getAccountPurchases(accountId).catch(() => []),
    getAccountDeposits(accountId).catch(() => []),
    getAccountWithdrawals(accountId).catch(() => []),
  ]);

  const totalSpent = purchases
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalDeposited = deposits
    .filter(d => d.status === 'completed')
    .reduce((sum, d) => sum + d.amount, 0);
  
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

  return {
    totalSpent,
    totalDeposited,
    totalWithdrawn,
    netChange: totalDeposited - totalSpent - totalWithdrawn,
    transactionCount: purchases.length + deposits.length + withdrawals.length,
  };
}
