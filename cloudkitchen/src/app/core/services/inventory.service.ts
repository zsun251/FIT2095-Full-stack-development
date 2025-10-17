import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { Inventory, InventoryRequest, InventoryResponse } from '../../shared/models/inventory.model';

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
   * Get all inventory items with alerts
   * @returns Observable with inventory arrays
   */
  getAllInventory(): Observable<{
    inventory: Inventory[];
    expiredItems: Inventory[];
    expiringItems: Inventory[];
    lowStockItems: Inventory[];
  }> {
    return this.http.get<InventoryResponse>(`${this.API_URL}`).pipe(
      map(response => {
        if (response.success && response.data && typeof response.data === 'object' && 'inventory' in response.data) {
          return {
            inventory: response.data.inventory || [],
            expiredItems: response.data.expiredItems || [],
            expiringItems: response.data.expiringItems || [],
            lowStockItems: response.data.lowStockItems || []
          };
        }
        throw new Error(response.error || 'Failed to fetch inventory');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get inventory item by ID
   * @param inventoryId Inventory ID (format: I-XXXXX)
   * @returns Observable<Inventory>
   */
  getInventoryById(inventoryId: string): Observable<Inventory> {
    return this.http.get<InventoryResponse>(`${this.API_URL}/${inventoryId}`).pipe(
      map(response => {
        if (response.success && response.data && !('inventory' in response.data)) {
          return response.data as Inventory;
        }
        throw new Error(response.error || 'Inventory item not found');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Create a new inventory item
   * @param inventoryData Inventory data to create
   * @returns Observable<Inventory>
   */
  createInventory(inventoryData: InventoryRequest): Observable<Inventory> {
    return this.http.post<InventoryResponse>(`${this.API_URL}`, inventoryData).pipe(
      map(response => {
        if (response.success && response.data && !('inventory' in response.data)) {
          return response.data as Inventory;
        }
        throw new Error(response.error || 'Failed to create inventory item');
      }),
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
    return this.http.put<InventoryResponse>(`${this.API_URL}/${inventoryId}`, inventoryData).pipe(
      map(response => {
        if (response.success && response.data && !('inventory' in response.data)) {
          return response.data as Inventory;
        }
        throw new Error(response.error || 'Failed to update inventory item');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Delete an inventory item
   * @param inventoryId Inventory ID
   * @returns Observable<InventoryResponse>
   */
  deleteInventory(inventoryId: string): Observable<InventoryResponse> {
    return this.http.delete<InventoryResponse>(`${this.API_URL}/${inventoryId}`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to delete inventory item');
        }
        return response;
      }),
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
