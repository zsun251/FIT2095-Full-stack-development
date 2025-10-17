import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InventoryService } from '../../core/services/inventory.service';
import { AuthService } from '../../core/services/auth.service';
import { Inventory } from '../../shared/models/inventory.model';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inventory-list.component.html'
})
export class InventoryListComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private authService = inject(AuthService);

  inventory: Inventory[] = [];
  expiredItems: Inventory[] = [];
  expiringItems: Inventory[] = [];
  lowStockItems: Inventory[] = [];
  loading = false;
  error: string | null = null;
  currentUserId: string | null = null;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user?.userId || null;
      this.loadInventory();
    });
  }

  loadInventory(): void {
    this.loading = true;
    this.error = null;

    this.inventoryService.getAllInventory().subscribe({
      next: (data) => {
        this.inventory = data.inventory;
        this.expiredItems = data.expiredItems;
        this.expiringItems = data.expiringItems;
        this.lowStockItems = data.lowStockItems;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load inventory';
        this.loading = false;
      }
    });
  }

  deleteInventory(inventoryId: string, ingredientName: string): void {
    if (confirm(`Are you sure you want to delete this inventory item: ${ingredientName}?`)) {
      this.inventoryService.deleteInventory(inventoryId).subscribe({
        next: () => {
          this.loadInventory();
        },
        error: (err) => {
          this.error = err.message || 'Failed to delete inventory item';
        }
      });
    }
  }

  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'Vegetables': return 'bg-success';
      case 'Fruits': return 'bg-success';
      case 'Meat': return 'bg-danger';
      case 'Dairy': return 'bg-info';
      case 'Grains': return 'bg-warning';
      case 'Spices': return 'bg-warning';
      case 'Beverages': return 'bg-primary';
      case 'Frozen': return 'bg-info';
      case 'Canned': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  getCategorySubtext(category: string): string {
    switch (category) {
      case 'Vegetables': return 'Fresh Produce';
      case 'Fruits': return 'Fresh Produce';
      case 'Meat': return 'Protein';
      case 'Dairy': return 'Refrigerated';
      case 'Grains': return 'Pantry Staple';
      case 'Spices': return 'Seasoning';
      case 'Beverages': return 'Drinks';
      case 'Frozen': return 'Frozen Food';
      case 'Canned': return 'Preserved';
      default: return 'Misc Item';
    }
  }

  getLocationBadgeClass(location: string): string {
    switch (location) {
      case 'Fridge': return 'bg-primary';
      case 'Freezer': return 'bg-info';
      case 'Pantry': return 'bg-warning';
      case 'Counter': return 'bg-success';
      case 'Cupboard': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  getUnitLabel(unit: string): string {
    switch (unit) {
      case 'pieces': return 'Pieces';
      case 'kg': return 'Kilograms';
      case 'g': return 'Grams';
      case 'liters': return 'Liters';
      case 'ml': return 'Milliliters';
      case 'cups': return 'Cups';
      case 'tbsp': return 'Tablespoons';
      case 'tsp': return 'Teaspoons';
      case 'dozen': return 'Dozen';
      default: return unit;
    }
  }

  getTotalInventoryValue(): number {
    return this.inventory.reduce((sum, item) => sum + item.cost, 0);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return amount.toFixed(2);
  }
}
