import { Customer } from './customer.model';

export type AccountType = 'CURRENT_ACCOUNT' | 'SAVING_ACCOUNT';

export interface Account {
  id: string;
  createdAt: string;
  balance: number;
  type: AccountType;
  customerId: number;
  customer?: Customer | null;
}

export interface NewAccount {
  balance: number;
  type: AccountType;
  customerId: number;
}

export interface Totals {
  current: number;
  saving: number;
  total: number;
}

export const typeLabel = (type: AccountType) => (type === 'CURRENT_ACCOUNT' ? 'Current' : 'Savings');

export function totalsOf(accounts: Account[]): Totals {
  let current = 0;
  let saving = 0;
  for (const account of accounts) {
    if (account.type === 'CURRENT_ACCOUNT') current += account.balance;
    else saving += account.balance;
  }
  return { current, saving, total: current + saving };
}
