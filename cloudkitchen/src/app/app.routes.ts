import { Routes } from '@angular/router';

// Guards
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

// Auth Components
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

// Dashboard
import { DashboardComponent } from './features/dashboard/dashboard.component';

// Recipe Components
import { RecipeListComponent } from './features/recipes/recipe-list.component';
import { RecipeFormComponent } from './features/recipes/recipe-form.component';
import { RecipeDetailComponent } from './features/recipes/recipe-detail.component';
import { RecipeEditSelect } from './features/recipes/recipe-edit-select/recipe-edit-select';
import { RecipeDeleteSelect } from './features/recipes/recipe-delete-select/recipe-delete-select';

// Inventory Components
import { InventoryListComponent } from './features/inventory/inventory-list.component';
import { InventoryFormComponent } from './features/inventory/inventory-form.component';
import { InventoryEditSelect } from './features/inventory/inventory-edit-select/inventory-edit-select';
import { InventoryDeleteSelect } from './features/inventory/inventory-delete-select/inventory-delete-select';

// Shared Components
import { ErrorComponent } from './shared/components/error/error.component';

export const routes: Routes = [
  // Default route
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },

  // Public routes
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },

  // Protected routes - Dashboard
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },

  // Protected routes - Recipes (Chef only)
  {
    path: 'recipes',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['chef'] },
    children: [
      {
        path: '',
        component: RecipeListComponent
      },
      {
        path: 'add',
        component: RecipeFormComponent
      },
      {
        path: 'edit',
        component: RecipeEditSelect
      },
      {
        path: 'delete',
        component: RecipeDeleteSelect
      },
      {
        path: ':id',
        component: RecipeDetailComponent
      }
    ]
  },

  // Protected routes - Inventory (All authenticated users)
  {
    path: 'inventory',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        component: InventoryListComponent
      },
      {
        path: 'add',
        component: InventoryFormComponent
      },
      {
        path: 'edit',
        component: InventoryEditSelect
      },
      {
        path: 'delete',
        component: InventoryDeleteSelect
      }
    ]
  },

  // Future: Reports routes (Admin only)
  // {
  //   path: 'reports',
  //   canActivate: [authGuard, roleGuard],
  //   data: { roles: ['admin'] },
  //   loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORT_ROUTES)
  // },

  // Wildcard route - must be last
  {
    path: '**',
    component: ErrorComponent
  }
];
