import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  // API base URL - update this to match your backend
  private readonly API_URL = 'http://localhost:3000';
  private readonly STUDENT_ID = '';

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
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        this.isAuthenticated.set(true);
      } catch (error) {
        console.error('Error loading user from storage:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  /**
   * Register a new user
   * @param registerData User registration data
   * @returns Observable<AuthResponse>
   */
  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, registerData).pipe(
      tap(response => {
        if (response.success && response.user) {
          this.setCurrentUser(response.user);
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
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, loginData).pipe(
      tap(response => {
        if (response.success && response.user) {
          this.setCurrentUser(response.user);
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
    return this.http.post<AuthResponse>(`${this.API_URL}/logout`, {}).pipe(
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
   */
  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    this.isAuthenticated.set(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  /**
   * Clear current user and authentication state
   */
  private clearCurrentUser(): void {
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem('currentUser');
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
   * Matches Assignment 2 validation logic:
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
   * Matches Assignment 2 validation logic
   * @param phone Phone number to validate
   * @returns boolean
   */
  validatePhoneNumber(phone: string): boolean {
    const patterns = [
      /^\+61[- ]?[2-9]\d{8}$/,  // +61 format
      /^0[2-9]\d{8}$/,           // 0 format
      /^\([0-9]{2}\)[- ]?\d{4}[- ]?\d{4}$/  // (XX) XXXX XXXX format
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
