import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

// Import components
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },

  // Protected routes - require authentication
  // TODO: Uncomment these routes when implementing Recipe, Inventory, and Reports features

  // Recipe routes (Chef only) - will be implemented in next tasks
  // {
  //   path: 'recipes',
  //   canActivate: [authGuard, roleGuard],
  //   data: { roles: ['chef'] },
  //   loadChildren: () => import('./features/recipes/recipes.routes').then(m => m.RECIPE_ROUTES)
  // },

  // Inventory routes (All authenticated users) - will be implemented in next tasks
  // {
  //   path: 'inventory',
  //   canActivate: [authGuard],
  //   loadChildren: () => import('./features/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES)
  // },

  // Reports routes (Admin only) - will be implemented in next tasks
  // {
  //   path: 'reports',
  //   canActivate: [authGuard, roleGuard],
  //   data: { roles: ['admin'] },
  //   loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORT_ROUTES)
  // },

  // Fallback route - redirect to home
  {
    path: '**',
    redirectTo: ''
  }
];
