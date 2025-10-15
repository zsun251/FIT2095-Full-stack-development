import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Role Guard - Protects routes based on user role
 * Usage: Add to route definition with data: { roles: ['admin', 'chef'] }
 * canActivate: [roleGuard]
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated first
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Get required roles from route data
  const requiredRoles = route.data['roles'] as string[];
  const currentUser = authService.getCurrentUser();

  // If no roles specified, allow access (authenticated users only)
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Check if user has required role
  if (currentUser && requiredRoles.includes(currentUser.role)) {
    return true;
  }

  // User doesn't have required role - redirect to home
  router.navigate(['/']);
  return false;
};
