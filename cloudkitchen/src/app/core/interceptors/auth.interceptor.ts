import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Auth Interceptor - Add authentication headers to HTTP requests
 * This interceptor can be extended to add JWT tokens or other auth headers
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Clone the request and add headers if needed
  // For now, we're using session-based auth
  // which uses cookies, so no need to add headers

  // If you switch to token-based auth, uncomment and modify:
  // const token = localStorage.getItem('authToken');
  // if (token) {
  //   req = req.clone({
  //     setHeaders: {
  //       Authorization: `Bearer ${token}`
  //     }
  //   });
  // }

  // Add withCredentials to support session cookies
  const authReq = req.clone({
    withCredentials: true
  });

  return next(authReq);
};
