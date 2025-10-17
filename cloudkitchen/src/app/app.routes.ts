import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

// Import components
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { RecipeListComponent } from './features/recipes/recipe-list.component';
import { RecipeFormComponent } from './features/recipes/recipe-form.component';
import { RecipeEditSelect } from './features/recipes/recipe-edit-select/recipe-edit-select';
import { RecipeDeleteSelect } from './features/recipes/recipe-delete-select/recipe-delete-select';
import { InventoryListComponent } from './features/inventory/inventory-list.component';
import { InventoryFormComponent } from './features/inventory/inventory-form.component';
import { InventoryEditSelect } from './features/inventory/inventory-edit-select/inventory-edit-select';
import { InventoryDeleteSelect } from './features/inventory/inventory-delete-select/inventory-delete-select';
import { ErrorComponent } from './shared/components/error/error.component';

export const routes: Routes = [
  // Default route - redirect to login
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  // Dashboard - requires authentication
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },

  // Protected routes - require authentication

  // Recipe routes (Chef only)
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
      }
    ]
  },

  // Inventory routes (All authenticated users)
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

  // Reports routes (Admin only) - will be implemented in next tasks
  // {
  //   path: 'reports',
  //   canActivate: [authGuard, roleGuard],
  //   data: { roles: ['admin'] },
  //   loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORT_ROUTES)
  // },

  // 404 Not Found - Wildcard route must be last
  {
    path: '**',
    component: ErrorComponent
  }
];
