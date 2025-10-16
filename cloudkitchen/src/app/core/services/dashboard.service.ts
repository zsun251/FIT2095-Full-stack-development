import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

/**
 * Dashboard Statistics Interface
 */
export interface DashboardStats {
  totalUsers: number;
  totalRecipes: number;
  totalInventory: number;
  inventoryValue: number;
}

export interface DashboardResponse {
  success: boolean;
  data?: DashboardStats;
  message?: string;
  error?: string;
}

/**
 * Dashboard Service - Fetches dashboard statistics
 * Student: Zhan Sun ()
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api/dashboard';

  /**
   * Get dashboard statistics from backend
   */
  getStatistics(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.API_URL}/stats`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Error handler
   */
  private handleError(error: any): Observable<never> {
    console.error('Dashboard Service Error:', error);
    return throwError(() => new Error(error.message || 'Failed to fetch statistics'));
  }
}
