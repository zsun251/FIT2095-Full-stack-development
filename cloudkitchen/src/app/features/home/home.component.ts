import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../shared/models/user.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  private authService = inject(AuthService);

  currentUser: User | null = null;
  readonly STUDENT_ID = '';

  // Statistics (will be fetched from API later)
  totalUsers: number = 0;
  totalRecipes: number = 0;
  totalInventory: number = 0;

  constructor() {
    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Load statistics if user is logged in
    if (this.authService.isLoggedIn()) {
      this.loadStatistics();
    }
  }

  /**
   * Load dashboard statistics from API
   * (Placeholder - will implement when backend API is ready)
   */
  private loadStatistics(): void {
    // TODO: Fetch actual statistics from backend
    // For now using placeholder values
    this.totalUsers = 0;
    this.totalRecipes = 0;
    this.totalInventory = 0;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  /**
   * Check if user is logged in
   */
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
}
