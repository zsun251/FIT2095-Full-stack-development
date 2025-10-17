import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { Inventory } from '../../../shared/models/inventory.model';

@Component({
  selector: 'app-inventory-delete-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-delete-select.html'
})
export class InventoryDeleteSelect implements OnInit {
  inventoryItems: Inventory[] = [];
  selectedItemId: string = '';
  selectedItem: Inventory | null = null;
  showDetails: boolean = false;
  confirmChecked: boolean = false;
  loading: boolean = true;
  error: string = '';

  constructor(
    private inventoryService: InventoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.loading = true;
    this.inventoryService.getAllInventory().subscribe({
      next: (data) => {
        this.inventoryItems = data.inventory;
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = 'Failed to load inventory items';
        this.loading = false;
        console.error('Error loading inventory:', err);
      }
    });
  }

  onItemSelect(): void {
    if (!this.selectedItemId) {
      this.showDetails = false;
      this.selectedItem = null;
      this.confirmChecked = false;
      return;
    }

    this.selectedItem = this.inventoryItems.find(item => item.inventoryId === this.selectedItemId) || null;

    if (this.selectedItem) {
      this.showDetails = true;
      this.confirmChecked = false;
    }
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }

  onDelete(): void {
    if (!this.selectedItemId || !this.confirmChecked) {
      return;
    }

    if (confirm(`Are you sure you want to delete "${this.selectedItem?.ingredientName}"? This action cannot be undone.`)) {
      this.inventoryService.deleteInventory(this.selectedItemId).subscribe({
        next: () => {
          alert('Inventory item deleted successfully!');
          this.router.navigate(['/inventory/list']);
        },
        error: (err: Error) => {
          this.error = 'Failed to delete inventory item';
          console.error('Error deleting item:', err);
          alert('Failed to delete inventory item. Please try again.');
        }
      });
    }
  }

  resetForm(): void {
    this.selectedItemId = '';
    this.showDetails = false;
    this.selectedItem = null;
    this.confirmChecked = false;
    this.error = '';
  }

  goBack(): void {
    this.router.navigate(['/inventory/list']);
  }
}
