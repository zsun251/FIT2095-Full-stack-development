import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { User } from '../../shared/models/user.model';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  currentUser: User | null = null;
  readonly STUDENT_NAME = 'Zhan Sun';
  readonly STUDENT_ID = '';

  // Statistics - real-time updates
  totalUsers: number = 0;
  totalRecipes: number = 0;
  totalInventory: number = 0;
  inventoryValue: number = 0;
  isLoadingStats = false;

  private statsSubscription?: Subscription;
  private autoRefreshSubscription?: Subscription;

  ngOnInit(): void {
    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadStatistics();
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    this.statsSubscription?.unsubscribe();
  }

  /**
   * Load statistics from backend - real-time data
   */
  loadStatistics(): void {
    if (!this.isLoggedIn) return;

    this.isLoadingStats = true;
    this.statsSubscription = this.dashboardService.getStatistics().subscribe({
      next: (response) => {
        this.isLoadingStats = false;
        if (response.success && response.data) {
          this.totalUsers = response.data.totalUsers;
          this.totalRecipes = response.data.totalRecipes;
          this.totalInventory = response.data.totalInventory;
          this.inventoryValue = response.data.inventoryValue;
        }
      },
      error: (error) => {
        this.isLoadingStats = false;
        console.error('Failed to load statistics:', error);
      }
    });
  }

  /**
   * Auto-refresh every 30 seconds (Task 2 requirement)
   */
  private startAutoRefresh(): void {
    this.autoRefreshSubscription = interval(30000).subscribe(() => {
      this.loadStatistics();
    });
  }

  private stopAutoRefresh(): void {
    this.autoRefreshSubscription?.unsubscribe();
  }

  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get welcomeMessage(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }
}
