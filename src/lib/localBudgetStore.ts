// Local file-based budget goal storage for demo purposes
import fs from 'fs';
import path from 'path';

export interface BudgetGoal {
  id: string;
  goalType: 'limit' | 'reduction';
  category: string;
  amount: number;
  period: 'day' | 'week' | 'month';
  startDate: string;
  endDate: string;
  currentSpending: number;
  alertThresholds: number[];
  alertsTriggered: number[];
  status: 'active' | 'completed' | 'exceeded';
  createdAt: string;
  updatedAt: string;
}

interface BudgetStore {
  goals: BudgetGoal[];
}

const STORE_PATH = path.join(process.cwd(), 'data', 'budget-goals.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read the store
function readStore(): BudgetStore {
  ensureDataDir();
  if (!fs.existsSync(STORE_PATH)) {
    return { goals: [] };
  }
  try {
    const data = fs.readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { goals: [] };
  }
}

// Write the store
function writeStore(store: BudgetStore) {
  ensureDataDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Calculate end date based on period
function calculateEndDate(startDate: Date, period: string): Date {
  const end = new Date(startDate);
  switch (period) {
    case 'day':
      end.setDate(end.getDate() + 1);
      break;
    case 'week':
      end.setDate(end.getDate() + 7);
      break;
    case 'month':
      end.setMonth(end.getMonth() + 1);
      break;
  }
  return end;
}

// CRUD Operations
export function getAllGoals(): BudgetGoal[] {
  const store = readStore();
  return store.goals;
}

export function getActiveGoals(): BudgetGoal[] {
  const store = readStore();
  const now = new Date();
  return store.goals.filter(g => 
    g.status === 'active' && new Date(g.endDate) >= now
  );
}

export function getGoalById(id: string): BudgetGoal | undefined {
  const store = readStore();
  return store.goals.find(g => g.id === id);
}

export function createGoal(data: {
  goalType: 'limit' | 'reduction';
  category: string;
  amount: number;
  period: 'day' | 'week' | 'month';
}): BudgetGoal {
  const store = readStore();
  const now = new Date();
  
  const newGoal: BudgetGoal = {
    id: generateId(),
    goalType: data.goalType,
    category: data.category,
    amount: data.amount,
    period: data.period,
    startDate: now.toISOString(),
    endDate: calculateEndDate(now, data.period).toISOString(),
    currentSpending: 0,
    alertThresholds: [50, 75, 90, 100],
    alertsTriggered: [],
    status: 'active',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  
  store.goals.push(newGoal);
  writeStore(store);
  return newGoal;
}

export function updateGoal(id: string, updates: Partial<BudgetGoal>): BudgetGoal | null {
  const store = readStore();
  const index = store.goals.findIndex(g => g.id === id);
  
  if (index === -1) return null;
  
  store.goals[index] = {
    ...store.goals[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  writeStore(store);
  return store.goals[index];
}

export function deleteGoal(id: string): boolean {
  const store = readStore();
  const index = store.goals.findIndex(g => g.id === id);
  
  if (index === -1) return false;
  
  store.goals.splice(index, 1);
  writeStore(store);
  return true;
}

export function getGoalsByCategory(category: string): BudgetGoal[] {
  const store = readStore();
  return store.goals.filter(g => g.category === category && g.status === 'active');
}

// Reset all goals (useful for demo)
export function resetAllGoals(): void {
  writeStore({ goals: [] });
}
