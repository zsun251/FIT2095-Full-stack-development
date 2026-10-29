import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Auth Interceptor - Attach the JWT to API requests
 * and send the user back to login when the token is rejected
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Token expired or invalid: clear the stale session (once) and log in again
      if (error.status === 401 && authService.isLoggedIn()) {
        authService.clearCurrentUser();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
