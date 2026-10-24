import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'Wallet | E-Bank', loadComponent: () => import('./pages/wallet/wallet').then((m) => m.Wallet) },
  { path: 'accounts', title: 'Accounts | E-Bank', loadComponent: () => import('./pages/accounts/accounts').then((m) => m.Accounts) },
  { path: 'customers', title: 'Customers | E-Bank', loadComponent: () => import('./pages/customers/customers').then((m) => m.Customers) },
  { path: 'assistant', title: 'Assistant | E-Bank', loadComponent: () => import('./pages/assistant/assistant').then((m) => m.Assistant) },
  { path: 'network', title: 'Network | E-Bank', loadComponent: () => import('./pages/network/network').then((m) => m.Network) },
  { path: '**', redirectTo: '' },
];
