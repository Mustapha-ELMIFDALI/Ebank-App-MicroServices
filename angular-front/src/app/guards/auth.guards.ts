import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const signedInGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isValid()) return true;
  if (auth.signedIn()) auth.signOut(true);
  const next = state.url === '/' ? {} : { next: state.url };
  return inject(Router).createUrlTree(['/login'], { queryParams: next });
};

export const signedOutGuard: CanActivateFn = () =>
  !inject(AuthService).isValid() || inject(Router).createUrlTree(['/']);
