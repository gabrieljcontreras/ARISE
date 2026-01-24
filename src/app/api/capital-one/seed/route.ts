/**
 * Seed Test Data API
 * POST /api/capital-one/seed
 * 
 * Creates test data in the Nessie sandbox for testing
 */

import { NextResponse } from 'next/server';
import { 
  getCustomers,
  createCustomer,
  createAccount,
  getCustomerAccounts,
  getAllMerchants,
  createPurchase,
  createDeposit
} from '@/lib/capitalOne';

export async function POST() {
  try {
    const results: string[] = [];

    // Check if we already have customers
    let customers = await getCustomers();
    let customerId: string;

    if (customers.length === 0) {
      // Create a test customer
      const customerResult = await createCustomer({
        first_name: 'ARISE',
        last_name: 'Player',
        address: {
          street_number: '123',
          street_name: 'Game Street',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
        },
      });
      customerId = customerResult.objectCreated._id;
      results.push(`Created customer: ${customerId}`);
    } else {
      customerId = customers[0]._id;
      results.push(`Using existing customer: ${customerId}`);
    }

    // Check if customer has accounts
    let accounts = await getCustomerAccounts(customerId);

    if (accounts.length === 0) {
      // Create checking account
      const checkingResult = await createAccount(customerId, {
        type: 'Checking',
        nickname: 'Main Checking',
        rewards: 100,
        balance: 5000,
      });
      results.push(`Created checking account: ${checkingResult.objectCreated._id}`);

      // Create savings account
      const savingsResult = await createAccount(customerId, {
        type: 'Savings',
        nickname: 'Emergency Fund',
        rewards: 50,
        balance: 2000,
      });
      results.push(`Created savings account: ${savingsResult.objectCreated._id}`);

      // Refresh accounts list
      accounts = await getCustomerAccounts(customerId);
    } else {
      results.push(`Using existing ${accounts.length} account(s)`);
    }

    const checkingAccount = accounts.find(a => a.type === 'Checking') || accounts[0];

    // Get merchants for purchases
    const merchants = await getAllMerchants();
    
    if (merchants.length === 0) {
      results.push('No merchants found in sandbox - cannot create purchases');
    } else {
      // Create some test transactions
      const today = new Date().toISOString().split('T')[0];
      
      // Good transaction - grocery store
      const groceryMerchant = merchants.find(m => 
        m.category?.some(c => c.toLowerCase().includes('grocery'))
      ) || merchants[0];

      try {
        await createPurchase(checkingAccount._id, {
          merchant_id: groceryMerchant._id,
          medium: 'balance',
          purchase_date: today,
          amount: 85.50,
          description: 'Weekly grocery shopping',
        });
        results.push('Created grocery purchase (good)');
      } catch (e) {
        results.push(`Failed to create grocery purchase: ${e}`);
      }

      // Bad transaction - random expensive purchase
      const luxuryMerchant = merchants.find(m => 
        m.category?.some(c => 
          c.toLowerCase().includes('luxury') || 
          c.toLowerCase().includes('clothing') ||
          c.toLowerCase().includes('fashion')
        )
      ) || merchants[1] || merchants[0];

      try {
        await createPurchase(checkingAccount._id, {
          merchant_id: luxuryMerchant._id,
          medium: 'balance',
          purchase_date: today,
          amount: 250.00,
          description: 'Designer impulse buy',
        });
        results.push('Created luxury purchase (bad)');
      } catch (e) {
        results.push(`Failed to create luxury purchase: ${e}`);
      }

      // Create a deposit (paycheck)
      try {
        await createDeposit(checkingAccount._id, {
          medium: 'balance',
          transaction_date: today,
          amount: 2500.00,
          description: 'Bi-weekly paycheck direct deposit',
        });
        results.push('Created paycheck deposit (good)');
      } catch (e) {
        results.push(`Failed to create deposit: ${e}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test data seeding completed',
      customerId,
      accountId: checkingAccount._id,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to seed test data', details: message },
      { status: 500 }
    );
  }
}
