import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { InventoryService } from '../../core/services/inventory.service';
import { AuthService } from '../../core/services/auth.service';
import { Inventory } from '../../shared/models/inventory.model';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './inventory-form.component.html'
})
export class InventoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  inventoryForm!: FormGroup;
  isEditMode = false;
  inventoryId: string | null = null;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  currentUserId: string | null = null;

  units = ['pieces', 'kg', 'g', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'dozen'];
  categories = ['Vegetables', 'Fruits', 'Meat', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Frozen', 'Canned', 'Other'];
  locations = ['Fridge', 'Freezer', 'Pantry', 'Counter', 'Cupboard'];

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user?.userId || null;
    });

    // Initialize form
    this.initializeForm();

    // Check if edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.inventoryId = params['id'];
        if (this.inventoryId) {
          this.loadInventory(this.inventoryId);
        }
      }
    });
  }

  initializeForm(): void {
    this.inventoryForm = this.fb.group({
      ingredientName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s\-]+$/)
      ]],
      quantity: ['', [
        Validators.required,
        Validators.min(0.01),
        Validators.max(9999)
      ]],
      unit: ['', Validators.required],
      category: ['', Validators.required],
      purchaseDate: ['', Validators.required],
      expirationDate: ['', Validators.required],
      location: ['', Validators.required],
      cost: ['', [
        Validators.required,
        Validators.min(0.01),
        Validators.max(999.99)
      ]]
    });
  }

  loadInventory(inventoryId: string): void {
    this.loading = true;
    this.inventoryService.getInventoryById(inventoryId).subscribe({
      next: (inventory) => {
        this.inventoryForm.patchValue({
          ingredientName: inventory.ingredientName,
          quantity: inventory.quantity,
          unit: inventory.unit,
          category: inventory.category,
          purchaseDate: this.formatDateForInput(inventory.purchaseDate),
          expirationDate: this.formatDateForInput(inventory.expirationDate),
          location: inventory.location,
          cost: inventory.cost
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load inventory item';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.inventoryForm.invalid || !this.currentUserId) {
      Object.keys(this.inventoryForm.controls).forEach(key => {
        this.inventoryForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Additional validation for dates
    const purchaseDate = new Date(this.inventoryForm.value.purchaseDate);
    const expirationDate = new Date(this.inventoryForm.value.expirationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if purchase date is in the future
    if (purchaseDate > today) {
      this.error = 'Purchase date cannot be in the future';
      return;
    }

    // Check if expiration date is before purchase date
    if (expirationDate <= purchaseDate) {
      this.error = 'Expiration date must be after purchase date';
      return;
    }

    // Validate quantity decimal places
    const quantity = this.inventoryForm.value.quantity;
    if (!this.hasMaxTwoDecimals(quantity)) {
      this.error = 'Quantity can have maximum 2 decimal places';
      return;
    }

    // Validate cost decimal places
    const cost = this.inventoryForm.value.cost;
    if (!this.hasMaxTwoDecimals(cost)) {
      this.error = 'Cost can have maximum 2 decimal places';
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.inventoryForm.value;
    const inventoryData = {
      ingredientName: formValue.ingredientName.trim(),
      quantity: parseFloat(formValue.quantity),
      unit: formValue.unit,
      category: formValue.category,
      purchaseDate: formValue.purchaseDate,
      expirationDate: formValue.expirationDate,
      location: formValue.location,
      cost: parseFloat(formValue.cost),
      userId: this.currentUserId
    };

    if (this.isEditMode && this.inventoryId) {
      this.inventoryService.updateInventory(this.inventoryId, inventoryData).subscribe({
        next: () => {
          this.successMessage = 'Inventory item updated successfully!';
          setTimeout(() => {
            this.router.navigate(['/inventory']);
          }, 1500);
        },
        error: (err) => {
          this.error = err.message || 'Failed to update inventory item';
          this.loading = false;
        }
      });
    } else {
      this.inventoryService.createInventory(inventoryData).subscribe({
        next: () => {
          this.successMessage = 'Inventory item added successfully!';
          setTimeout(() => {
            this.router.navigate(['/inventory']);
          }, 1500);
        },
        error: (err) => {
          this.error = err.message || 'Failed to add inventory item';
          this.loading = false;
        }
      });
    }
  }

  hasMaxTwoDecimals(value: number): boolean {
    const str = value.toString();
    const decimalIndex = str.indexOf('.');
    if (decimalIndex === -1) return true;
    return str.substring(decimalIndex + 1).length <= 2;
  }

  formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getTodayDate(): string {
    const today = new Date();
    return this.formatDateForInput(today);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.inventoryForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.inventoryForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'This field is required';
    if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength} characters`;
    if (field.errors['maxlength']) return `Maximum length is ${field.errors['maxlength'].requiredLength} characters`;
    if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
    if (field.errors['max']) return `Maximum value is ${field.errors['max'].max}`;
    if (field.errors['pattern']) return 'Only letters, spaces, and hyphens allowed';

    return 'Invalid value';
  }

  getUnitLabel(unit: string): string {
    const labels: { [key: string]: string } = {
      'pieces': 'Pieces',
      'kg': 'Kilograms (kg)',
      'g': 'Grams (g)',
      'liters': 'Liters',
      'ml': 'Milliliters (ml)',
      'cups': 'Cups',
      'tbsp': 'Tablespoons (tbsp)',
      'tsp': 'Teaspoons (tsp)',
      'dozen': 'Dozen'
    };
    return labels[unit] || unit;
  }
}
