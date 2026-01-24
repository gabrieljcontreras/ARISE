/**
 * Transaction Analysis API - Hybrid Approach
 * POST /api/analyze-transactions
 * 
 * Combines:
 * 1. Rule-based analyzer (fast, reliable) from transactionAnalyzer.ts
 * 2. Gemini AI enhancement (smarter insights, optional)
 * 3. Budget goal tracking and alerts
 * 
 * Flow: Rule-based first → Gemini enhances → Check budget goals → Return with alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
import { 
  analyzeTransactions as ruleBasedAnalyze,
  type TransactionJudgment 
} from '@/lib/transactionAnalyzer';
import {
  getActiveGoals,
  updateGoal,
  getGoalsByCategory,
  BudgetGoal
} from '@/lib/localBudgetStore';

// Models to try in order of preference
const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite", 
  "gemma-3-27b-it"
];

// Category mapping for budget goals
const CATEGORY_MAPPING: Record<string, string[]> = {
  dining: ['dining', 'restaurant', 'dinner', 'lunch'],  // More specific, check first
  food: ['food', 'food & drink', 'takeout', 'fast food'],
  entertainment: ['entertainment', 'streaming', 'movies', 'games', 'gaming', 'fun'],
  groceries: ['groceries', 'grocery', 'supermarket'],
  shopping: ['shopping', 'retail', 'amazon', 'target', 'walmart'],
  transportation: ['transportation', 'transport', 'gas', 'uber', 'lyft', 'transit'],
  subscriptions: ['subscriptions', 'subscription', 'recurring'],
  coffee: ['coffee', 'cafe', 'coffee shops', 'starbucks'],
  alcohol: ['alcohol', 'bar', 'liquor', 'wine', 'beer'],
  travel: ['travel', 'airlines', 'hotels', 'vacation'],
};

function mapCategoryToBudgetCategory(txCategory: string): string | null {
  const lowerCategory = txCategory.toLowerCase();
  
  // First check for exact matches
  if (CATEGORY_MAPPING[lowerCategory]) {
    return lowerCategory;
  }
  
  // Then check for keyword matches
  for (const [budgetCat, keywords] of Object.entries(CATEGORY_MAPPING)) {
    if (keywords.some(kw => lowerCategory.includes(kw) || kw.includes(lowerCategory))) {
      return budgetCat;
    }
  }
  return null;
}

export interface BudgetAlert {
  goalId: string;
  category: string;
  threshold: number;
  percentageUsed: number;
  remaining: number;
  message: string;
  exceeded: boolean;
}

export interface TransactionAnalysis {
  id: string;
  type: 'purchase' | 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description: string;
  date: string;
  merchantName?: string;
  merchantCategory?: string;  // The actual merchant category for budget tracking
  category: string;
  judgment: 'good' | 'bad' | 'neutral';
  points: number;
  reason: string;
  aiEnhanced: boolean;
}

export interface AnalysisSummary {
  transactions: TransactionAnalysis[];
  totalPoints: number;
  goodCount: number;
  badCount: number;
  neutralCount: number;
  spendingByCategory: Record<string, number>;
  spendingByMerchantCategory: Record<string, number>;  // For budget tracking
  totalSpending: number;
  totalIncome: number;
  essentialSpending: number;
  discretionarySpending: number;
  insights: string[];
  budgetAlerts?: BudgetAlert[];
}

/**
 * Convert rule-based judgment to our format
 */
function convertJudgment(judgment: TransactionJudgment): TransactionAnalysis {
  return {
    id: judgment.transactionId,
    type: judgment.transactionType,
    amount: judgment.amount,
    description: judgment.description,
    date: judgment.date,
    category: judgment.subcategory || judgment.category,
    judgment: judgment.judgment === 'reward' ? 'good' : judgment.judgment === 'punishment' ? 'bad' : 'neutral',
    points: judgment.points,
    reason: judgment.reason,
    aiEnhanced: false
  };
}

/**
 * Use Gemini to enhance/verify the rule-based analysis
 */
async function enhanceWithGemini(
  genAI: GoogleGenerativeAI,
  transactions: TransactionAnalysis[]
): Promise<TransactionAnalysis[]> {
  if (transactions.length === 0) return transactions;

  // Batch analyze for efficiency (instead of one-by-one)
  const prompt = `You are a financial advisor for a life gamification app. Review these transactions and provide enhanced analysis.

TRANSACTIONS:
${transactions.map((t, i) => `${i + 1}. [${t.type.toUpperCase()}] $${t.amount.toFixed(2)} - "${t.description}" 
   Current judgment: ${t.judgment} (${t.points} pts) - "${t.reason}"`).join('\n')}

For each transaction, confirm or adjust the judgment. Consider:
- Is the categorization accurate?
- Should the points be adjusted based on context?
- Provide a more insightful reason if possible

Return ONLY a valid JSON array with objects for each transaction:
[
  {
    "index": 0,
    "category": "more specific category if needed",
    "judgment": "good" or "bad" or "neutral",
    "points": adjusted points (number),
    "reason": "brief insightful reason (max 15 words)"
  },
  ...
]

Keep original values if they seem correct. Only adjust if you have good reason.`;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Extract JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const enhancements = JSON.parse(jsonMatch[0]);
        
        // Apply enhancements
        return transactions.map((tx, index) => {
          const enhancement = enhancements.find((e: { index: number }) => e.index === index);
          if (enhancement) {
            return {
              ...tx,
              category: enhancement.category || tx.category,
              judgment: enhancement.judgment || tx.judgment,
              points: typeof enhancement.points === 'number' ? enhancement.points : tx.points,
              reason: enhancement.reason || tx.reason,
              aiEnhanced: true
            };
          }
          return tx;
        });
      }
    } catch (error) {
      console.error(`Gemini enhancement with ${modelName} failed:`, error);
      continue;
    }
  }

  // Return original if all models fail
  return transactions;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, useAI = true } = body;

    // Get account ID
    let targetAccountId = accountId;
    let primaryAccount: Account | null = null;

    if (!targetAccountId) {
      const customers = await getCustomers();
      if (customers.length === 0) {
        return NextResponse.json({ error: 'No customers found' }, { status: 404 });
      }

      const accounts = await getCustomerAccounts(customers[0]._id);
      if (accounts.length === 0) {
        return NextResponse.json({ error: 'No accounts found' }, { status: 404 });
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
    const merchantNames = new Map<string, string>();
    merchantsArray.forEach((m) => {
      if (m) {
        merchants.set(m._id, m);
        merchantNames.set(m._id, m.name);
      }
    });

    // Build accounts map
    const accountsMap = new Map<string, Account>();
    accountsMap.set(primaryAccount._id, primaryAccount);

    // STEP 1: Run rule-based analysis (fast & reliable)
    const ruleBasedResult = ruleBasedAnalyze(
      purchases,
      deposits,
      withdrawals,
      transfers,
      merchants,
      accountsMap,
      primaryAccount.balance
    );

    // Convert to our format and add merchant names and categories
    let analyzedTransactions: TransactionAnalysis[] = ruleBasedResult.judgments.map(j => {
      const converted = convertJudgment(j);
      // Add merchant name and category for purchases
      if (j.transactionType === 'purchase') {
        const purchase = purchases.find(p => p._id === j.transactionId);
        if (purchase) {
          const merchant = merchants.get(purchase.merchant_id);
          if (merchant) {
            converted.merchantName = merchant.name;
            // Use merchant category for budget tracking
            const cat = merchant.category as string | string[] | undefined;
            if (cat) {
              converted.merchantCategory = typeof cat === 'string' 
                ? cat.toLowerCase() 
                : cat.join(', ').toLowerCase();
            }
          }
        }
      }
      return converted;
    });

    // STEP 2: Optionally enhance with Gemini AI
    let aiEnhanced = false;
    if (useAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          analyzedTransactions = await enhanceWithGemini(genAI, analyzedTransactions);
          aiEnhanced = analyzedTransactions.some(t => t.aiEnhanced);
        } catch (error) {
          console.error('Gemini enhancement failed, using rule-based only:', error);
        }
      }
    }

    // Sort by date (newest first)
    analyzedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate summary stats - track spending by MERCHANT CATEGORY for budget purposes
    const spendingByCategory: Record<string, number> = {};
    const spendingByMerchantCategory: Record<string, number> = {};  // For budget tracking
    let totalSpending = 0;
    let totalIncome = 0;
    let essentialSpending = 0;
    let discretionarySpending = 0;

    for (const tx of analyzedTransactions) {
      if (tx.type === 'deposit') {
        totalIncome += tx.amount;
      } else if (tx.type === 'purchase' || tx.type === 'withdrawal') {
        totalSpending += tx.amount;
        spendingByCategory[tx.category] = (spendingByCategory[tx.category] || 0) + tx.amount;
        
        // Track by merchant category for budget goals
        if (tx.merchantCategory) {
          spendingByMerchantCategory[tx.merchantCategory] = 
            (spendingByMerchantCategory[tx.merchantCategory] || 0) + tx.amount;
        }
        
        if (tx.judgment === 'good') {
          essentialSpending += tx.amount;
        } else if (tx.judgment === 'bad') {
          discretionarySpending += tx.amount;
        }
      }
    }

    const totalPoints = analyzedTransactions.reduce((sum, t) => sum + t.points, 0);
    const goodCount = analyzedTransactions.filter(t => t.judgment === 'good').length;
    const badCount = analyzedTransactions.filter(t => t.judgment === 'bad').length;
    const neutralCount = analyzedTransactions.filter(t => t.judgment === 'neutral').length;

    // STEP 3: Check spending against budget goals (using local storage)
    let budgetAlerts: BudgetAlert[] = [];
    try {
      // Get all active budget goals from local storage
      const activeGoals = getActiveGoals();
      
      console.log('Active budget goals:', activeGoals.length);
      console.log('Spending by merchant category:', spendingByMerchantCategory);

      // For each category with spending, check against goals
      for (const [merchantCat, amount] of Object.entries(spendingByMerchantCategory)) {
        const budgetCategory = mapCategoryToBudgetCategory(merchantCat);
        console.log(`Mapping merchant category "${merchantCat}" -> budget category "${budgetCategory}"`);
        if (!budgetCategory) continue;

        // Find matching goals
        const matchingGoals = activeGoals.filter(
          g => g.category === budgetCategory
        );
        
        console.log(`Found ${matchingGoals.length} matching goals for ${budgetCategory}`);

        for (const goal of matchingGoals) {
          // Update the goal's current spending
          const oldSpending = goal.currentSpending;
          const newSpending = amount; // Set to current total for this category
          
          // Check for new alerts
          const percentageUsed = Math.round((newSpending / goal.amount) * 100);
          const oldPercentage = Math.round((oldSpending / goal.amount) * 100);
          
          const newAlerts: number[] = [];
          
          for (const threshold of goal.alertThresholds) {
            // Only alert if we crossed a new threshold
            if (percentageUsed >= threshold && oldPercentage < threshold && !goal.alertsTriggered.includes(threshold)) {
              newAlerts.push(threshold);
              
              let message = '';
              if (threshold >= 100) {
                message = `🚨 You've exceeded your ${goal.category} budget of $${goal.amount}! Currently at $${newSpending.toFixed(2)}`;
              } else if (threshold >= 90) {
                message = `⚠️ Critical! You've used ${percentageUsed}% of your ${goal.category} budget. Only $${(goal.amount - newSpending).toFixed(2)} left!`;
              } else if (threshold >= 75) {
                message = `⚡ Warning: You've used ${percentageUsed}% of your ${goal.category} budget.`;
              } else {
                message = `📊 You've reached ${threshold}% of your ${goal.category} budget.`;
              }

              budgetAlerts.push({
                goalId: goal.id,
                category: goal.category,
                threshold,
                percentageUsed,
                remaining: Math.max(0, goal.amount - newSpending),
                message,
                exceeded: percentageUsed >= 100
              });
            }
          }

          // Update the goal in local storage
          if (newSpending !== oldSpending || newAlerts.length > 0) {
            updateGoal(goal.id, {
              currentSpending: newSpending,
              alertsTriggered: [...goal.alertsTriggered, ...newAlerts],
              status: percentageUsed >= 100 ? 'exceeded' : 'active'
            });
          }
        }
      }
    } catch (budgetError) {
      console.error('Budget goal check failed:', budgetError);
      // Continue without budget alerts
    }

    const summary: AnalysisSummary = {
      transactions: analyzedTransactions,
      totalPoints,
      goodCount,
      badCount,
      neutralCount,
      spendingByCategory,
      spendingByMerchantCategory,
      totalSpending,
      totalIncome,
      essentialSpending,
      discretionarySpending,
      insights: ruleBasedResult.insights,
      budgetAlerts: budgetAlerts.length > 0 ? budgetAlerts : undefined
    };

    return NextResponse.json({
      success: true,
      accountId: targetAccountId,
      accountBalance: primaryAccount?.balance || 0,
      aiEnhanced,
      summary,
      budgetAlerts: budgetAlerts.length > 0 ? budgetAlerts : undefined
    });

  } catch (error) {
    console.error('Transaction analysis error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to analyze transactions', details: message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accountId = searchParams.get('accountId');
  const useAI = searchParams.get('useAI') !== 'false';
  
  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ accountId, useAI })
  });
  
  return POST(mockRequest);
}
