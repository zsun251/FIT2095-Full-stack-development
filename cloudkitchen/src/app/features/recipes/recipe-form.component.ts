import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { RecipeService } from '../../core/services/recipe.service';
import { AuthService } from '../../core/services/auth.service';
import { Recipe } from '../../shared/models/recipe.model';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './recipe-form.component.html'
})
export class RecipeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private recipeService = inject(RecipeService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  recipeForm!: FormGroup;
  isEditMode = false;
  recipeId: string | null = null;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  currentUserId: string | null = null;
  currentUserName: string | null = null;

  cuisineTypes = ['Italian', 'Asian', 'Mexican', 'American', 'French', 'Indian', 'Mediterranean', 'Other'];
  mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  difficultyLevels = ['Easy', 'Medium', 'Hard'];

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(user => {
      this.currentUserId = user?.userId || null;
      this.currentUserName = user?.fullname || null;
    });

    // Initialize form
    this.initializeForm();

    // Check if edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.recipeId = params['id'];
        if (this.recipeId) {
          this.loadRecipe(this.recipeId);
        }
      }
    });
  }

  initializeForm(): void {
    this.recipeForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      chef: [{ value: this.currentUserName || '', disabled: !this.isEditMode }, [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s\-']+$/)
      ]],
      cuisineType: ['', Validators.required],
      mealType: ['', Validators.required],
      prepTime: ['', [Validators.required, Validators.min(1), Validators.max(480)]],
      difficulty: ['', Validators.required],
      servings: ['', [Validators.required, Validators.min(1), Validators.max(20)]],
      ingredients: ['', Validators.required],
      instructions: ['', Validators.required]
    });

    // Update chef name when user info is loaded
    if (!this.isEditMode && this.currentUserName) {
      this.recipeForm.patchValue({ chef: this.currentUserName });
    }
  }

  loadRecipe(recipeId: string): void {
    this.loading = true;
    this.recipeService.getRecipeById(recipeId).subscribe({
      next: (recipe) => {
        this.recipeForm.patchValue({
          title: recipe.title,
          chef: recipe.chef,
          cuisineType: recipe.cuisineType,
          mealType: recipe.mealType,
          prepTime: recipe.prepTime,
          difficulty: recipe.difficulty,
          servings: recipe.servings,
          ingredients: recipe.ingredients.join(', '),
          instructions: recipe.instructions.join(', ')
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load recipe';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.recipeForm.invalid || !this.currentUserId) {
      Object.keys(this.recipeForm.controls).forEach(key => {
        this.recipeForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.recipeForm.value;
    const recipeData = {
      title: formValue.title.trim(),
      chef: this.isEditMode ? formValue.chef.trim() : (this.currentUserName || ''),
      cuisineType: formValue.cuisineType,
      mealType: formValue.mealType,
      prepTime: parseInt(formValue.prepTime),
      difficulty: formValue.difficulty,
      servings: parseInt(formValue.servings),
      ingredients: formValue.ingredients.split(',').map((item: string) => item.trim()).filter((item: string) => item),
      instructions: formValue.instructions.split(',').map((item: string) => item.trim()).filter((item: string) => item),
      userId: this.currentUserId
    };

    // Validate ingredients and instructions
    if (recipeData.ingredients.length === 0 || recipeData.ingredients.length > 20) {
      this.error = 'Please provide 1-20 ingredients';
      this.loading = false;
      return;
    }

    if (recipeData.ingredients.some((ing: string) => ing.length < 3)) {
      this.error = 'Each ingredient must be at least 3 characters long';
      this.loading = false;
      return;
    }

    if (recipeData.instructions.length === 0 || recipeData.instructions.length > 15) {
      this.error = 'Please provide 1-15 instruction steps';
      this.loading = false;
      return;
    }

    if (recipeData.instructions.some((inst: string) => inst.length < 10)) {
      this.error = 'Each instruction step must be at least 10 characters long';
      this.loading = false;
      return;
    }

    if (this.isEditMode && this.recipeId) {
      this.recipeService.updateRecipe(this.recipeId, recipeData).subscribe({
        next: () => {
          this.successMessage = 'Recipe updated successfully!';
          setTimeout(() => {
            this.router.navigate(['/recipes']);
          }, 1500);
        },
        error: (err) => {
          this.error = err.message || 'Failed to update recipe';
          this.loading = false;
        }
      });
    } else {
      this.recipeService.createRecipe(recipeData).subscribe({
        next: () => {
          this.successMessage = 'Recipe added successfully!';
          setTimeout(() => {
            this.router.navigate(['/recipes']);
          }, 1500);
        },
        error: (err) => {
          this.error = err.message || 'Failed to add recipe';
          this.loading = false;
        }
      });
    }
  }

  getIngredientsCount(): number {
    const ingredients = this.recipeForm.get('ingredients')?.value || '';
    if (!ingredients.trim()) return 0;
    return ingredients.split(',').map((item: string) => item.trim()).filter((item: string) => item).length;
  }

  getInstructionsCount(): number {
    const instructions = this.recipeForm.get('instructions')?.value || '';
    if (!instructions.trim()) return 0;
    return instructions.split(',').map((item: string) => item.trim()).filter((item: string) => item).length;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.recipeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.recipeForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'This field is required';
    if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength} characters`;
    if (field.errors['maxlength']) return `Maximum length is ${field.errors['maxlength'].requiredLength} characters`;
    if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
    if (field.errors['max']) return `Maximum value is ${field.errors['max'].max}`;
    if (field.errors['pattern']) return 'Only letters, spaces, hyphens, and apostrophes allowed';

    return 'Invalid value';
  }
}
