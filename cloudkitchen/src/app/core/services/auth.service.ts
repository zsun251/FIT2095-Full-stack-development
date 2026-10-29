import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  // API base URL (same origin; the dev server proxies /api to the backend)
  private readonly API_URL = '';

  // Current user state
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Authentication state signal (Angular 20+ feature)
  public isAuthenticated = signal(false);

  constructor() {
    // Check if user is already logged in (from localStorage)
    this.loadUserFromStorage();
  }

  /**
   * Load user from localStorage on app initialization
   */
  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser && this.getToken()) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        this.isAuthenticated.set(true);
      } catch (error) {
        console.error('Error loading user from storage:', error);
        this.clearCurrentUser();
      }
    }
  }

  /**
   * Register a new user
   * @param registerData User registration data
   * @returns Observable<AuthResponse>
   */
  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/api/auth/register`, registerData).pipe(
      tap(response => {
        if (response.success && response.user && response.token) {
          this.setCurrentUser(response.user, response.token);
        }
      }),
      catchError(error => {
        console.error('Registration error:', error);
        return of({
          success: false,
          message: 'Registration failed',
          error: error.error?.message || 'An error occurred during registration'
        });
      })
    );
  }

  /**
   * Login user with email and password
   * @param loginData Login credentials
   * @returns Observable<AuthResponse>
   */
  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/api/auth/login`, loginData).pipe(
      tap(response => {
        if (response.success && response.user && response.token) {
          this.setCurrentUser(response.user, response.token);
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        return of({
          success: false,
          message: 'Login failed',
          error: error.error?.message || 'Invalid email or password'
        });
      })
    );
  }

  /**
   * Logout current user
   * @returns Observable<AuthResponse>
   */
  logout(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/api/auth/logout`, {}).pipe(
      tap(() => {
        this.clearCurrentUser();
      }),
      catchError(error => {
        console.error('Logout error:', error);
        // Clear user even if backend call fails
        this.clearCurrentUser();
        return of({
          success: true,
          message: 'Logged out successfully'
        });
      })
    );
  }

  /**
   * Set current user and update authentication state
   * @param user User object
   * @param token JWT issued by the backend
   */
  private setCurrentUser(user: User, token: string): void {
    this.currentUserSubject.next(user);
    this.isAuthenticated.set(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('authToken', token);
  }

  /**
   * Clear current user and authentication state
   */
  clearCurrentUser(): void {
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  }

  /**
   * Get the stored JWT
   * @returns Token or null
   */
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Get current user value
   * @returns Current user or null
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   * @returns boolean
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Check if current user has specific role
   * @param role Role to check
   * @returns boolean
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Validate password strength
   * Validation rules:
   * - At least 8 characters
   * - Contains uppercase letter
   * - Contains lowercase letter
   * - Contains number
   * - Contains special character
   * @param password Password to validate
   * @returns Object with validation result
   */
  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate Australian phone number
   * Matches backend validation logic: +61 412 345 678 or +61-412-345-678
   * @param phone Phone number to validate
   * @returns boolean
   */
  validatePhoneNumber(phone: string): boolean {
    const patterns = [
      /^\+61 \d{3} \d{3} \d{3}$/,    // +61 412 345 678
      /^\+61-\d{3}-\d{3}-\d{3}$/     // +61-412-345-678
    ];

    return patterns.some(pattern => pattern.test(phone));
  }

  /**
   * Validate email format
   * @param email Email to validate
   * @returns boolean
   */
  validateEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  /**
   * Validate full name
   * @param fullname Full name to validate
   * @returns boolean
   */
  validateFullName(fullname: string): boolean {
    const namePattern = /^[a-zA-Z\s\-']+$/;
    return fullname.length >= 2 &&
           fullname.length <= 100 &&
           namePattern.test(fullname);
  }
}
