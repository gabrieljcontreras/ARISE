/**
 * Transactions API
 * GET /api/capital-one/transactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getCustomers, 
  getCustomerAccounts, 
  getAccountPurchases,
  getAccountDeposits,
  getAccountWithdrawals,
  getAccountTransfers,
  getMerchant
} from '@/lib/capitalOne';
import type { Purchase, Deposit, Withdrawal, Transfer, Merchant } from '@/lib/capitalOne';

interface TransactionWithMerchant extends Purchase {
  merchant?: Merchant;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    const type = searchParams.get('type'); // 'purchases', 'deposits', 'withdrawals', 'transfers', or all

    let targetAccountId = accountId;

    // If no account specified, get first customer's first account
    if (!targetAccountId) {
      const customers = await getCustomers();
      if (customers.length === 0) {
        return NextResponse.json(
          { error: 'No customers found in sandbox' },
          { status: 404 }
        );
      }
      
      const accounts = await getCustomerAccounts(customers[0]._id);
      if (accounts.length === 0) {
        return NextResponse.json(
          { error: 'No accounts found for customer' },
          { status: 404 }
        );
      }
      
      targetAccountId = accounts[0]._id;
    }

    // Fetch transactions based on type filter
    let purchases: Purchase[] = [];
    let deposits: Deposit[] = [];
    let withdrawals: Withdrawal[] = [];
    let transfers: Transfer[] = [];

    if (!type || type === 'purchases') {
      purchases = await getAccountPurchases(targetAccountId).catch(() => []);
    }
    if (!type || type === 'deposits') {
      deposits = await getAccountDeposits(targetAccountId).catch(() => []);
    }
    if (!type || type === 'withdrawals') {
      withdrawals = await getAccountWithdrawals(targetAccountId).catch(() => []);
    }
    if (!type || type === 'transfers') {
      transfers = await getAccountTransfers(targetAccountId).catch(() => []);
    }

    // Enrich purchases with merchant data
    const purchasesWithMerchants: TransactionWithMerchant[] = await Promise.all(
      purchases.map(async (purchase) => {
        try {
          const merchant = await getMerchant(purchase.merchant_id);
          return { ...purchase, merchant };
        } catch {
          return purchase;
        }
      })
    );

    return NextResponse.json({
      accountId: targetAccountId,
      transactions: {
        purchases: purchasesWithMerchants,
        deposits,
        withdrawals,
        transfers,
      },
      summary: {
        totalPurchases: purchases.length,
        totalDeposits: deposits.length,
        totalWithdrawals: withdrawals.length,
        totalTransfers: transfers.length,
        totalTransactions: purchases.length + deposits.length + withdrawals.length + transfers.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: message },
      { status: 500 }
    );
  }
}
