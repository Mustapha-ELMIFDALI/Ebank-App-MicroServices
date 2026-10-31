import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { GATEWAY_URL } from '../api.config';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const gateway = inject(GATEWAY_URL);
  const token = auth.token();

  // the token only ever goes to the gateway, and never to the public endpoints
  const isPublic = /\/auth\/(login|signup)$|\/actuator\/health$/.test(request.url);
  if (!token || isPublic || !request.url.startsWith(`${gateway}/`)) return next(request);

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && auth.token() === token) auth.signOut(true);
      return throwError(() => error);
    }),
  );
};
