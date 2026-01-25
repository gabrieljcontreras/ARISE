/**
 * Capital One Data API
 * GET /api/capital-one-data
 * 
 * Fetches account data, transactions, and calculates savings/budget metrics
 * for display in the dashboard
 */

import { NextResponse } from 'next/server';
import {
  getCustomerAccounts,
  getAccountPurchases,
  getAccountDeposits,
  getAccount,
  getMerchant
} from '@/lib/capitalOne';

const CUSTOMER_ID = '69752c2b95150878eafe81ec';

// Category mapping for spending analysis
const CATEGORY_MAPPING: Record<string, string[]> = {
  dining: ['dining', 'restaurant', 'dinner', 'lunch', 'food & drink'],
  food: ['food', 'takeout', 'fast food'],
  entertainment: ['entertainment', 'streaming', 'movies', 'games', 'gaming', 'fun'],
  groceries: ['groceries', 'grocery', 'supermarket'],
  shopping: ['shopping', 'retail', 'amazon', 'target', 'walmart'],
  transportation: ['transportation', 'transport', 'gas', 'uber', 'lyft', 'transit'],
  subscriptions: ['subscriptions', 'subscription', 'recurring'],
  coffee: ['coffee', 'cafe', 'coffee shops', 'starbucks'],
  alcohol: ['alcohol', 'bar', 'liquor', 'wine', 'beer'],
  travel: ['travel', 'airlines', 'hotels', 'vacation'],
};

function categorizeByMerchant(merchantCategory: string): string {
  const lowerCategory = merchantCategory.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_MAPPING)) {
    if (keywords.some(kw => lowerCategory.includes(kw) || kw.includes(lowerCategory))) {
      return category;
    }
  }
  return 'other';
}

export async function GET() {
  try {
    // Get all accounts for the customer
    const accounts = await getCustomerAccounts(CUSTOMER_ID);
    
    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No accounts found' 
      }, { status: 404 });
    }

    // Get primary account (first checking account or any account)
    const primaryAccount = accounts.find(a => a.type === 'Checking') || accounts[0];
    const accountId = primaryAccount._id;
    
    // Fetch account details for balance
    const accountDetails = await getAccount(accountId);
    const currentBalance = accountDetails?.balance || 0;

    // Get purchases for the account
    const purchases = await getAccountPurchases(accountId) || [];
    
    // Get deposits for savings tracking
    const deposits = await getAccountDeposits(accountId) || [];

    // Calculate spending by category (this month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const spendingByCategory: Record<string, number> = {};
    const weeklySpending: Record<string, number> = {};
    let totalSpentThisMonth = 0;
    let totalSpentThisWeek = 0;

    const recentTransactions: Array<{
      id: string;
      description: string;
      amount: number;
      date: string;
      category: string;
      merchantName: string;
    }> = [];

    for (const purchase of purchases) {
      const purchaseDate = new Date(purchase.purchase_date);
      const amount = purchase.amount || 0;
      
      // Get merchant info for categorization
      let merchantName = 'Unknown Merchant';
      let merchantCategory = 'other';
      
      if (purchase.merchant_id) {
        try {
          const merchant = await getMerchant(purchase.merchant_id);
          if (merchant) {
            merchantName = merchant.name || merchantName;
            merchantCategory = categorizeByMerchant(merchant.category?.join(' ') || 'other');
          }
        } catch {
          // Use defaults
        }
      }

      // Add to recent transactions
      recentTransactions.push({
        id: purchase._id,
        description: purchase.description || merchantName,
        amount,
        date: purchase.purchase_date,
        category: merchantCategory,
        merchantName
      });

      // Track monthly spending
      if (purchaseDate >= startOfMonth) {
        totalSpentThisMonth += amount;
        spendingByCategory[merchantCategory] = (spendingByCategory[merchantCategory] || 0) + amount;
      }

      // Track weekly spending
      if (purchaseDate >= startOfWeek) {
        totalSpentThisWeek += amount;
        weeklySpending[merchantCategory] = (weeklySpending[merchantCategory] || 0) + amount;
      }
    }

    // Calculate total deposits (savings) this month
    let totalSavedThisMonth = 0;
    for (const deposit of deposits) {
      const depositDate = new Date(deposit.transaction_date);
      if (depositDate >= startOfMonth) {
        totalSavedThisMonth += deposit.amount || 0;
      }
    }

    // Sort transactions by date (most recent first)
    recentTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      data: {
        accountId,
        currentBalance,
        savings: {
          totalSavedThisMonth,
          totalDeposits: deposits.length,
        },
        budget: {
          totalSpentThisMonth,
          totalSpentThisWeek,
          spendingByCategory,
          weeklySpending,
          transactionCount: purchases.length,
        },
        recentTransactions: recentTransactions.slice(0, 10), // Last 10 transactions
        accounts: accounts.map(a => ({
          id: a._id,
          type: a.type,
          nickname: a.nickname,
          balance: a.balance
        }))
      }
    });

  } catch (error) {
    console.error('Capital One API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch Capital One data',
      details: String(error)
    }, { status: 500 });
  }
}
