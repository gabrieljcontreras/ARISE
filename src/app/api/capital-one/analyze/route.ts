/**
 * Transaction Analysis API
 * GET /api/capital-one/analyze
 * 
 * Analyzes transactions and returns rewards/punishments for ARISE
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getCustomers, 
  getCustomerAccounts, 
  getAccountPurchases,
  getAccountDeposits,
  getAccountWithdrawals,
  getAccountTransfers,
  getMerchant,
  getAccount
} from '@/lib/capitalOne';
import type { Account, Merchant } from '@/lib/capitalOne';
import { analyzeTransactions } from '@/lib/transactionAnalyzer';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');

    let targetAccountId = accountId;
    let primaryAccount: Account | null = null;

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
      primaryAccount = accounts[0];
    } else {
      primaryAccount = await getAccount(targetAccountId);
    }

    // Fetch all transactions
    const [purchases, deposits, withdrawals, transfers] = await Promise.all([
      getAccountPurchases(targetAccountId).catch(() => []),
      getAccountDeposits(targetAccountId).catch(() => []),
      getAccountWithdrawals(targetAccountId).catch(() => []),
      getAccountTransfers(targetAccountId).catch(() => []),
    ]);

    // Build merchant map
    const merchantIds = [...new Set(purchases.map(p => p.merchant_id))];
    const merchantsArray = await Promise.all(
      merchantIds.map(async (id) => {
        try {
          return await getMerchant(id);
        } catch {
          return null;
        }
      })
    );
    const merchants = new Map<string, Merchant>();
    merchantsArray.forEach((m) => {
      if (m) merchants.set(m._id, m);
    });

    // Build accounts map (for transfer analysis)
    const accounts = new Map<string, Account>();
    accounts.set(primaryAccount._id, primaryAccount);

    // Run analysis
    const analysis = analyzeTransactions(
      purchases,
      deposits,
      withdrawals,
      transfers,
      merchants,
      accounts,
      primaryAccount.balance
    );

    // Calculate ARISE stat changes
    const ariseStats = {
      health: 0,
      strength: 0,
      intelligence: 0,
      charisma: 0,
      luck: 0,
    };

    // Map financial behavior to stats
    for (const judgment of analysis.judgments) {
      if (judgment.judgment === 'reward') {
        if (judgment.subcategory === 'savings') {
          ariseStats.intelligence += Math.ceil(judgment.points * 0.5);
          ariseStats.luck += Math.ceil(judgment.points * 0.3);
        } else if (judgment.subcategory === 'budgeting') {
          ariseStats.intelligence += Math.ceil(judgment.points * 0.4);
          ariseStats.health += Math.ceil(judgment.points * 0.2);
        } else if (judgment.subcategory === 'income') {
          ariseStats.strength += Math.ceil(judgment.points * 0.3);
          ariseStats.charisma += Math.ceil(judgment.points * 0.2);
        }
      } else if (judgment.judgment === 'punishment') {
        if (judgment.severity === 'high') {
          ariseStats.health += judgment.points; // negative
          ariseStats.intelligence += Math.ceil(judgment.points * 0.5);
        } else if (judgment.severity === 'medium') {
          ariseStats.luck += judgment.points;
        } else {
          ariseStats.intelligence += Math.ceil(judgment.points * 0.3);
        }
      }
    }

    return NextResponse.json({
      accountId: targetAccountId,
      accountBalance: primaryAccount.balance,
      analysis,
      ariseStatChanges: ariseStats,
      summary: {
        message: analysis.netPoints >= 0 
          ? `Great job! You earned ${analysis.netPoints} points this period.`
          : `Watch your spending! You lost ${Math.abs(analysis.netPoints)} points this period.`,
        totalRewards: analysis.rewards,
        totalPunishments: analysis.punishments,
        netPoints: analysis.netPoints,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to analyze transactions', details: message },
      { status: 500 }
    );
  }
}
