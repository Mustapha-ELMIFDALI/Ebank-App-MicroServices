import { Routes } from '@angular/router';
import { signedInGuard, signedOutGuard } from './guards/auth.guards';

export const routes: Routes = [
  { path: 'login', title: 'Sign in | E-Bank', canActivate: [signedOutGuard], loadComponent: () => import('./pages/auth/login').then((m) => m.Login) },
  { path: 'signup', title: 'Create account | E-Bank', canActivate: [signedOutGuard], loadComponent: () => import('./pages/auth/signup').then((m) => m.Signup) },
  { path: '', title: 'Home | E-Bank', canActivate: [signedInGuard], loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
  { path: 'accounts', title: 'Accounts | E-Bank', canActivate: [signedInGuard], loadComponent: () => import('./pages/accounts/accounts').then((m) => m.Accounts) },
  { path: 'customers', title: 'Customers | E-Bank', canActivate: [signedInGuard], loadComponent: () => import('./pages/customers/customers').then((m) => m.Customers) },
  { path: 'bot', title: 'Bot | E-Bank', canActivate: [signedInGuard], loadComponent: () => import('./pages/assistant/assistant').then((m) => m.Assistant) },
  { path: 'network', title: 'Network | E-Bank', canActivate: [signedInGuard], loadComponent: () => import('./pages/network/network').then((m) => m.Network) },
  { path: '**', redirectTo: '' },
];
