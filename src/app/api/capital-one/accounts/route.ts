/**
 * Accounts API
 * GET /api/capital-one/accounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getCustomers, 
  getCustomerAccounts, 
  getAllAccounts,
  getAccountSpendingSummary 
} from '@/lib/capitalOne';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const includeSpending = searchParams.get('includeSpending') === 'true';

    let accounts;

    if (customerId) {
      // Get accounts for specific customer
      accounts = await getCustomerAccounts(customerId);
    } else {
      // Get first customer's accounts (or all accounts)
      const customers = await getCustomers();
      if (customers.length === 0) {
        return NextResponse.json(
          { error: 'No customers found in sandbox' },
          { status: 404 }
        );
      }
      accounts = await getCustomerAccounts(customers[0]._id);
    }

    // Optionally include spending summary for each account
    if (includeSpending) {
      const accountsWithSpending = await Promise.all(
        accounts.map(async (account) => {
          const spending = await getAccountSpendingSummary(account._id);
          return { ...account, spending };
        })
      );
      return NextResponse.json({ accounts: accountsWithSpending });
    }

    return NextResponse.json({ accounts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch accounts', details: message },
      { status: 500 }
    );
  }
}
