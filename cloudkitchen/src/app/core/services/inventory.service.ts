import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Inventory, InventoryRequest } from '../../shared/models/inventory.model';

/**
 * Inventory Service - Handles all inventory-related API calls
 * Based on employee-management DatabaseService pattern
 * Student: Zhan Sun ()
 */
@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private http = inject(HttpClient);

  // API base URL - matches backend configuration
  private readonly API_URL = 'http://localhost:3000/api/inventory';

  /**
   * Get all inventory items
   * @returns Observable<Inventory[]>
   */
  getAllInventory(): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(this.API_URL).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get inventory item by ID
   * @param inventoryId Inventory ID (format: I-XXXXX)
   * @returns Observable<Inventory>
   */
  getInventoryById(inventoryId: string): Observable<Inventory> {
    return this.http.get<Inventory>(`${this.API_URL}/${inventoryId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get inventory items by user ID
   * @param userId User ID (format: U-XXXXX)
   * @returns Observable<Inventory[]>
   */
  getInventoryByUserId(userId: string): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.API_URL}/user/${userId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Create a new inventory item
   * @param inventoryData Inventory data to create
   * @returns Observable<Inventory>
   */
  createInventory(inventoryData: InventoryRequest): Observable<Inventory> {
    return this.http.post<Inventory>(this.API_URL, inventoryData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update an existing inventory item
   * @param inventoryId Inventory ID
   * @param inventoryData Updated inventory data
   * @returns Observable<Inventory>
   */
  updateInventory(inventoryId: string, inventoryData: Partial<InventoryRequest>): Observable<Inventory> {
    return this.http.put<Inventory>(`${this.API_URL}/${inventoryId}`, inventoryData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Delete an inventory item
   * @param inventoryId Inventory ID
   * @returns Observable<any>
   */
  deleteInventory(inventoryId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${inventoryId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get low stock items
   * @param userId User ID
   * @returns Observable<Inventory[]>
   */
  getLowStockItems(userId: string): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.API_URL}/low-stock/${userId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get expiring items
   * @param userId User ID
   * @returns Observable<Inventory[]>
   */
  getExpiringItems(userId: string): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.API_URL}/expiring/${userId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get expired items
   * @param userId User ID
   * @returns Observable<Inventory[]>
   */
  getExpiredItems(userId: string): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.API_URL}/expired/${userId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Search inventory by filters
   * @param filters Search filters (category, location, etc.)
   * @returns Observable<Inventory[]>
   */
  searchInventory(filters: any): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.API_URL}/search`, { params: filters }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Error handler for HTTP requests
   * @param error HTTP error response
   * @returns Observable that throws error
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.message || `Error Code: ${error.status}`;
    }

    console.error('Inventory Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
