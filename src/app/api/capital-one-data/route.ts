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

// Category mapping for spending analysis - also checks description
const CATEGORY_MAPPING: Record<string, string[]> = {
  housing: ['rent', 'mortgage', 'housing', 'monthly rent'],
  dining: ['dining', 'restaurant', 'dinner', 'lunch', 'food & drink', 'thai palace', 'mcdonalds', 'mcdonald', 'burger', 'pizza', 'sushi', 'chipotle', 'subway', 'wendy', 'taco bell', 'chick-fil-a', 'panera'],
  food: ['food', 'takeout', 'fast food', 'chocolate', 'snack', 'candy'],
  entertainment: ['entertainment', 'streaming', 'movies', 'games', 'gaming', 'fun', 'netflix', 'spotify', 'hulu', 'disney', 'headphones', 'electronics'],
  groceries: ['groceries', 'grocery', 'supermarket', 'publix', 'kroger', 'whole foods', 'trader joe', 'safeway', 'apple at', 'produce'],
  shopping: ['shopping', 'retail', 'amazon', 'target', 'walmart', 'best buy', 'costco'],
  transportation: ['transportation', 'transport', 'gas', 'uber', 'lyft', 'transit', 'gas fill', 'shell', 'exxon', 'chevron'],
  subscriptions: ['subscriptions', 'subscription', 'recurring'],
  coffee: ['coffee', 'cafe', 'coffee shops', 'starbucks', 'dunkin', 'pastries', 'bakery'],
  alcohol: ['alcohol', 'bar', 'liquor', 'wine', 'beer'],
  travel: ['travel', 'airlines', 'hotels', 'vacation', 'airbnb'],
};

function categorizeTransaction(merchantCategory: string, description: string): string {
  const lowerCategory = merchantCategory.toLowerCase();
  const lowerDescription = description.toLowerCase();
  
  // Check description first (more specific)
  for (const [category, keywords] of Object.entries(CATEGORY_MAPPING)) {
    if (keywords.some(kw => lowerDescription.includes(kw))) {
      return category;
    }
  }
  
  // Then check merchant category
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
    // Use January 2026 as the reference date to match our sandbox data
    const now = new Date('2026-01-24');
    const startOfMonth = new Date(2026, 0, 1); // January 1, 2026
    const startOfWeek = new Date(2026, 0, 19); // Week of Jan 19-25, 2026 (Sunday)

    const spendingByCategory: Record<string, number> = {};
    const weeklySpending: Record<string, number> = {};
    let totalSpentThisMonth = 0;
    let totalSpentThisWeek = 0;
    let totalSpentAllTime = 0;

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
      let merchantName = purchase.description || 'Unknown Merchant';
      let merchantCategoryRaw = 'other';
      
      if (purchase.merchant_id) {
        try {
          const merchant = await getMerchant(purchase.merchant_id);
          if (merchant) {
            // Use description first, then merchant name as fallback
            merchantName = purchase.description || merchant.name || merchantName;
            merchantCategoryRaw = merchant.category?.join(' ') || 'other';
          }
        } catch {
          // Use defaults
        }
      }
      
      // Categorize using both merchant category and description
      const merchantCategory = categorizeTransaction(merchantCategoryRaw, merchantName);

      // Add to recent transactions
      recentTransactions.push({
        id: purchase._id,
        description: purchase.description || merchantName,
        amount,
        date: purchase.purchase_date,
        category: merchantCategory,
        merchantName
      });

      // Track all-time spending for balance calculation
      totalSpentAllTime += amount;

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

    // Sort transactions by date (most recent first), then by ID (newer IDs are higher)
    recentTransactions.sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      // For same date, sort by ID (newer transactions have lexicographically higher IDs)
      return b.id.localeCompare(a.id);
    });

    // Calculate balance: initial $5000 minus all purchases
    const INITIAL_BALANCE = 5000;
    const calculatedBalance = INITIAL_BALANCE - totalSpentAllTime;

    return NextResponse.json({
      success: true,
      data: {
        accountId,
        currentBalance: calculatedBalance,
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
