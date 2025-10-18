import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { Inventory } from '../../../shared/models/inventory.model';

@Component({
  selector: 'app-inventory-edit-select',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './inventory-edit-select.html'
})
export class InventoryEditSelect implements OnInit {
  inventoryItems: Inventory[] = [];
  selectedItemId: string = '';
  selectedItem: Inventory | null = null;
  showEditForm: boolean = false;
  loading: boolean = true;
  error: string = '';

  // Form fields
  formData = {
    ingredientName: '',
    category: '',
    quantity: 0,
    unit: '',
    location: '',
    cost: 0,
    purchaseDate: '',
    expirationDate: ''
  };

  categories = ['Vegetables', 'Fruits', 'Meat', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Frozen', 'Canned', 'Other'];
  units = ['pieces', 'kg', 'g', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'dozen'];
  locations = ['Fridge', 'Freezer', 'Pantry', 'Counter', 'Cupboard'];

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
      this.showEditForm = false;
      this.selectedItem = null;
      return;
    }

    this.selectedItem = this.inventoryItems.find(item => item.inventoryId === this.selectedItemId) || null;

    if (this.selectedItem) {
      // Populate form with selected item data
      this.formData = {
        ingredientName: this.selectedItem.ingredientName,
        category: this.selectedItem.category,
        quantity: this.selectedItem.quantity,
        unit: this.selectedItem.unit,
        location: this.selectedItem.location,
        cost: this.selectedItem.cost,
        purchaseDate: this.formatDate(this.selectedItem.purchaseDate),
        expirationDate: this.formatDate(this.selectedItem.expirationDate)
      };
      this.showEditForm = true;
    }
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    if (!this.selectedItemId || !this.selectedItem) {
      return;
    }

    const updatedItem = {
      ingredientName: this.formData.ingredientName,
      category: this.formData.category,
      quantity: this.formData.quantity,
      unit: this.formData.unit,
      location: this.formData.location,
      cost: this.formData.cost,
      purchaseDate: this.formData.purchaseDate,
      expirationDate: this.formData.expirationDate,
      userId: this.selectedItem.userId
    };

    this.inventoryService.updateInventory(this.selectedItemId, updatedItem).subscribe({
      next: () => {
        alert('Inventory item updated successfully!');
        this.router.navigate(['/inventory/list']);
      },
      error: (err: Error) => {
        this.error = 'Failed to update inventory item';
        console.error('Error updating item:', err);
        alert('Failed to update inventory item. Please try again.');
      }
    });
  }

  resetForm(): void {
    this.selectedItemId = '';
    this.showEditForm = false;
    this.selectedItem = null;
    this.error = '';
  }

  goBack(): void {
    this.router.navigate(['/inventory/list']);
  }
}
