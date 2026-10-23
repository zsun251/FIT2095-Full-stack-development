import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser: User | null = null;

  constructor() {
    // Subscribe to current user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  /**
   * Check if user is logged in
   */
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  /**
   * Check if current user has specific role
   */
  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  /**
   * Handle logout
   */
  onLogout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout().subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Logout error:', error);
          // Still redirect to login even if API call fails
          this.router.navigate(['/login']);
        }
      });
    }
  }
}
