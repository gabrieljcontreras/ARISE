/**
 * Transaction Analyzer for ARISE
 * Categorizes transactions as "good" or "bad" financial decisions
 * and calculates appropriate rewards/punishments
 */

import type { Purchase, Deposit, Withdrawal, Transfer, Account, Merchant } from './capitalOne';

// ============================================
// SPENDING CATEGORIES - What's Good vs Bad
// ============================================

// Merchants/categories that are considered BAD spending
const BAD_SPENDING_CATEGORIES = [
  'luxury', 'designer', 'jewelry', 'fashion', 'clothing', 'apparel',
  'gambling', 'casino', 'nightclub', 'bar', 'alcohol', 'tobacco', 'vape',
  'fast food', 'fast_food', 'convenience', 'vending',
  'restaurant', 'dining', 'cafe', 'coffee shop',
  'subscription', 'streaming',
  'payday loan', 'cash advance',
];

// Merchants/categories that are considered GOOD spending
const GOOD_SPENDING_CATEGORIES = [
  'grocery', 'groceries', 'supermarket', 'pharmacy', 'medical', 'healthcare', 'health', 'insurance',
  'education', 'books', 'bookstore', 'courses', 'training', 'school', 'university',
  'investment', 'brokerage', 'stocks', 'retirement', '401k', 'ira',
  'utilities', 'electric', 'gas', 'water', 'internet', 'phone', 'rent', 'mortgage',
  'gas station', 'fuel', 'public transit', 'transit',
  'savings', 'transfer to savings',
];

// Keywords in descriptions that indicate bad choices
const BAD_KEYWORDS = [
  'luxury', 'designer', 'gucci', 'louis vuitton', 'prada', 'rolex',
  'club', 'bar tab', 'nightlife', 'casino', 'lottery', 'gambling',
  'uber eats', 'doordash', 'grubhub', 'postmates', 'delivery fee',
  'late fee', 'overdraft', 'nsf', 'interest charge', 'penalty',
  'impulse', 'splurge',
];

// Keywords in descriptions that indicate good choices
const GOOD_KEYWORDS = [
  'savings', 'investment', 'deposit', 'paycheck', 'salary', 'income',
  'grocery', 'utilities', 'rent', 'mortgage', 'insurance',
  'education', 'course', 'book', 'training',
  'gym', 'fitness', 'health',
  'emergency fund', 'retirement', '401k', 'ira',
];

// ============================================
// TYPE DEFINITIONS
// ============================================

export type JudgmentType = 'reward' | 'punishment' | 'neutral';

export interface TransactionJudgment {
  transactionId: string;
  transactionType: 'purchase' | 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description: string;
  date: string;
  judgment: JudgmentType;
  reason: string;
  points: number;
  category: string;
  subcategory: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AnalysisSummary {
  totalTransactions: number;
  rewards: number;
  punishments: number;
  neutral: number;
  totalPointsEarned: number;
  totalPointsLost: number;
  netPoints: number;
  judgments: TransactionJudgment[];
  insights: string[];
}

// ============================================
// ANALYSIS FUNCTIONS
// ============================================

/**
 * Analyze a single purchase and determine if it's good or bad
 */
export function analyzePurchase(
  purchase: Purchase,
  merchant: Merchant | null,
  accountBalance: number
): TransactionJudgment {
  const description = purchase.description?.toLowerCase() || '';
  const merchantName = merchant?.name?.toLowerCase() || '';
  const merchantCategories = merchant?.category?.map(c => c.toLowerCase()) || [];
  const amount = purchase.amount;

  let isBad = false;
  let isGood = false;
  let reason = '';
  let subcategory = 'spending';
  let severity: 'low' | 'medium' | 'high' = 'low';

  // Check merchant categories
  for (const cat of merchantCategories) {
    if (BAD_SPENDING_CATEGORIES.some(bad => cat.includes(bad))) {
      isBad = true;
      reason = `Unnecessary spending at ${merchant?.name || 'merchant'} (${cat})`;
      break;
    }
    if (GOOD_SPENDING_CATEGORIES.some(good => cat.includes(good))) {
      isGood = true;
      reason = `Smart spending on ${cat}`;
      subcategory = cat.includes('grocery') ? 'budgeting' : 'spending';
      break;
    }
  }

  // Check description keywords
  if (!isBad && !isGood) {
    for (const keyword of BAD_KEYWORDS) {
      if (description.includes(keyword) || merchantName.includes(keyword)) {
        isBad = true;
        reason = `Detected unnecessary expense: "${keyword}"`;
        break;
      }
    }
  }

  if (!isBad && !isGood) {
    for (const keyword of GOOD_KEYWORDS) {
      if (description.includes(keyword) || merchantName.includes(keyword)) {
        isGood = true;
        reason = `Smart spending on: "${keyword}"`;
        break;
      }
    }
  }

  // Check if spending is proportionally too high compared to balance
  if (!isBad && amount > accountBalance * 0.2) {
    isBad = true;
    severity = 'high';
    reason = `Large purchase (${((amount / accountBalance) * 100).toFixed(0)}% of balance) - potential overspending`;
    subcategory = 'spending';
  }

  // Calculate points based on amount and severity
  let points = 0;
  if (isBad) {
    severity = amount > 100 ? 'high' : amount > 30 ? 'medium' : 'low';
    points = -Math.round(amount * (severity === 'high' ? 0.5 : severity === 'medium' ? 0.3 : 0.1));
    points = Math.max(points, -50);
  } else if (isGood) {
    severity = amount > 100 ? 'high' : amount > 30 ? 'medium' : 'low';
    points = Math.round(amount * (severity === 'high' ? 0.2 : severity === 'medium' ? 0.15 : 0.1));
    points = Math.min(points, 30);
  }

  return {
    transactionId: purchase._id,
    transactionType: 'purchase',
    amount: purchase.amount,
    description: purchase.description,
    date: purchase.purchase_date,
    judgment: isBad ? 'punishment' : isGood ? 'reward' : 'neutral',
    reason: reason || 'Regular transaction',
    points,
    category: 'financial',
    subcategory,
    severity,
  };
}

/**
 * Analyze a deposit - deposits are generally good!
 */
export function analyzeDeposit(deposit: Deposit): TransactionJudgment {
  const description = deposit.description?.toLowerCase() || '';
  const amount = deposit.amount;

  let subcategory = 'income';
  let reason = 'Income received';
  let severity: 'low' | 'medium' | 'high' = 'medium';

  if (description.includes('paycheck') || description.includes('salary') || description.includes('direct deposit')) {
    subcategory = 'income';
    reason = 'Paycheck received - steady income!';
    severity = 'high';
  } else if (description.includes('savings') || description.includes('transfer')) {
    subcategory = 'savings';
    reason = 'Money saved - great financial decision!';
  } else if (description.includes('refund') || description.includes('return')) {
    reason = 'Refund received';
    severity = 'low';
  }

  const points = Math.min(Math.round(amount * 0.1), 25);

  return {
    transactionId: deposit._id,
    transactionType: 'deposit',
    amount: deposit.amount,
    description: deposit.description,
    date: deposit.transaction_date,
    judgment: 'reward',
    reason,
    points,
    category: 'financial',
    subcategory,
    severity,
  };
}

/**
 * Analyze a withdrawal - context matters
 */
export function analyzeWithdrawal(withdrawal: Withdrawal, accountBalance: number): TransactionJudgment {
  const description = withdrawal.description?.toLowerCase() || '';
  const amount = withdrawal.amount;

  let judgment: JudgmentType = 'neutral';
  let reason = 'Cash withdrawal';
  let points = 0;
  let severity: 'low' | 'medium' | 'high' = 'low';
  const subcategory = 'spending';

  if (amount > accountBalance * 0.3) {
    judgment = 'punishment';
    severity = 'high';
    reason = `Large cash withdrawal (${((amount / accountBalance) * 100).toFixed(0)}% of balance) - risky`;
    points = -Math.round(amount * 0.15);
  } else if (description.includes('atm') && amount > 100) {
    judgment = 'punishment';
    severity = 'medium';
    reason = 'Large ATM withdrawal - cash spending is harder to track';
    points = -5;
  }

  return {
    transactionId: withdrawal._id,
    transactionType: 'withdrawal',
    amount: withdrawal.amount,
    description: withdrawal.description,
    date: withdrawal.transaction_date,
    judgment,
    reason,
    points,
    category: 'financial',
    subcategory,
    severity,
  };
}

/**
 * Analyze a transfer
 */
export function analyzeTransfer(
  transfer: Transfer,
  fromAccount: Account | null,
  toAccount: Account | null
): TransactionJudgment {
  const description = transfer.description?.toLowerCase() || '';
  const amount = transfer.amount;

  let judgment: JudgmentType = 'neutral';
  let reason = 'Transfer between accounts';
  let points = 0;
  let subcategory = 'budgeting';
  let severity: 'low' | 'medium' | 'high' = 'low';

  if (toAccount?.type === 'Savings' || description.includes('savings')) {
    judgment = 'reward';
    reason = 'Transferred money to savings - excellent!';
    subcategory = 'savings';
    severity = amount > 100 ? 'high' : 'medium';
    points = Math.min(Math.round(amount * 0.15), 20);
  } else if (fromAccount?.type === 'Savings') {
    judgment = 'punishment';
    reason = 'Withdrew from savings - try to keep that money saved!';
    subcategory = 'savings';
    severity = amount > 100 ? 'high' : 'medium';
    points = -Math.round(amount * 0.1);
  }

  return {
    transactionId: transfer._id,
    transactionType: 'transfer',
    amount: transfer.amount,
    description: transfer.description,
    date: transfer.transaction_date,
    judgment,
    reason,
    points,
    category: 'financial',
    subcategory,
    severity,
  };
}

/**
 * Generate insights from the analysis
 */
export function generateInsights(judgments: TransactionJudgment[]): string[] {
  const insights: string[] = [];
  
  const purchases = judgments.filter(j => j.transactionType === 'purchase');
  const badPurchases = purchases.filter(j => j.judgment === 'punishment');
  const deposits = judgments.filter(j => j.transactionType === 'deposit');
  const savingsTransfers = judgments.filter(
    j => j.transactionType === 'transfer' && j.subcategory === 'savings' && j.judgment === 'reward'
  );

  if (badPurchases.length > purchases.length * 0.5) {
    insights.push('⚠️ More than half your purchases are unnecessary spending. Consider cutting back.');
  }
  
  if (badPurchases.length === 0 && purchases.length > 0) {
    insights.push('🎉 Great job! All your purchases were smart spending decisions.');
  }

  if (savingsTransfers.length > 0) {
    const totalSaved = savingsTransfers.reduce((sum, j) => sum + j.amount, 0);
    insights.push(`💰 You saved $${totalSaved.toFixed(2)} - keep it up!`);
  } else if (deposits.length > 0) {
    insights.push('💡 Tip: Consider setting up automatic transfers to savings.');
  }

  if (deposits.length > 0) {
    const totalIncome = deposits.reduce((sum, j) => sum + j.amount, 0);
    const totalSpent = purchases.reduce((sum, j) => sum + j.amount, 0);
    const savingsRate = ((totalIncome - totalSpent) / totalIncome * 100);
    
    if (savingsRate > 20) {
      insights.push(`📈 Your savings rate is ${savingsRate.toFixed(0)}% - excellent financial health!`);
    } else if (savingsRate < 0) {
      insights.push(`📉 You're spending more than you earn. Time to budget!`);
    }
  }

  const highSeverityBad = judgments.filter(j => j.judgment === 'punishment' && j.severity === 'high');
  if (highSeverityBad.length > 0) {
    insights.push(`🚨 ${highSeverityBad.length} transaction(s) significantly hurt your finances.`);
  }

  return insights;
}

/**
 * Analyze all transactions and produce a summary
 */
export function analyzeTransactions(
  purchases: Purchase[],
  deposits: Deposit[],
  withdrawals: Withdrawal[],
  transfers: Transfer[],
  merchants: Map<string, Merchant>,
  accounts: Map<string, Account>,
  primaryAccountBalance: number
): AnalysisSummary {
  const judgments: TransactionJudgment[] = [];

  for (const purchase of purchases) {
    const merchant = merchants.get(purchase.merchant_id) || null;
    judgments.push(analyzePurchase(purchase, merchant, primaryAccountBalance));
  }

  for (const deposit of deposits) {
    judgments.push(analyzeDeposit(deposit));
  }

  for (const withdrawal of withdrawals) {
    judgments.push(analyzeWithdrawal(withdrawal, primaryAccountBalance));
  }

  for (const transfer of transfers) {
    const fromAccount = accounts.get(transfer.payer_id) || null;
    const toAccount = accounts.get(transfer.payee_id) || null;
    judgments.push(analyzeTransfer(transfer, fromAccount, toAccount));
  }

  const rewards = judgments.filter(j => j.judgment === 'reward').length;
  const punishments = judgments.filter(j => j.judgment === 'punishment').length;
  const neutral = judgments.filter(j => j.judgment === 'neutral').length;
  
  const totalPointsEarned = judgments
    .filter(j => j.points > 0)
    .reduce((sum, j) => sum + j.points, 0);
  
  const totalPointsLost = judgments
    .filter(j => j.points < 0)
    .reduce((sum, j) => sum + Math.abs(j.points), 0);

  return {
    totalTransactions: judgments.length,
    rewards,
    punishments,
    neutral,
    totalPointsEarned,
    totalPointsLost,
    netPoints: totalPointsEarned - totalPointsLost,
    judgments,
    insights: generateInsights(judgments),
  };
}
