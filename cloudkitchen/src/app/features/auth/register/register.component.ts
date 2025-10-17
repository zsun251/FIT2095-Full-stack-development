import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  // Password strength indicators
  passwordChecks = {
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  };

  ngOnInit() {
    // Redirect to dashboard if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Initialize registration form with validators
    this.registerForm = this.fb.group({
      fullname: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        this.fullnameValidator
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        this.emailValidator
      ]],
      password: ['', [
        Validators.required,
        this.passwordStrengthValidator.bind(this)
      ]],
      confirmPassword: ['', [Validators.required]],
      phone: ['', [
        Validators.required,
        this.phoneValidator.bind(this)
      ]],
      role: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    // Watch password changes for real-time strength indicator
    this.registerForm.get('password')?.valueChanges.subscribe(password => {
      this.updatePasswordChecks(password);
    });
  }

  /**
   * Custom validator for full name
   */
  private fullnameValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const namePattern = /^[a-zA-Z\s\-']+$/;
    if (!namePattern.test(control.value)) {
      return { invalidName: 'Full name can only contain letters, spaces, hyphens, and apostrophes' };
    }

    return null;
  }

  /**
   * Custom validator for email
   */
  private emailValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(control.value)) {
      return { invalidEmail: 'Please enter a valid email address' };
    }

    return null;
  }

  /**
   * Custom validator for password strength (matching Assignment 2 logic)
   */
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const validation = this.authService.validatePasswordStrength(control.value);

    if (!validation.valid) {
      return { weakPassword: validation.errors.join('. ') };
    }

    return null;
  }

  /**
   * Custom validator for password match
   */
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (confirmPassword && password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    // Clear error if passwords match
    const confirmControl = group.get('confirmPassword');
    if (confirmControl?.hasError('passwordMismatch')) {
      confirmControl.setErrors(null);
    }

    return null;
  }

  /**
   * Custom validator for Australian phone number
   */
  private phoneValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    if (!this.authService.validatePhoneNumber(control.value)) {
      return { invalidPhone: 'Please enter a valid Australian phone number' };
    }

    return null;
  }

  /**
   * Update password strength checks for visual indicator
   */
  private updatePasswordChecks(password: string): void {
    this.passwordChecks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  }

  /**
   * Get form control for easier access in template
   */
  get f() {
    return this.registerForm.controls;
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';

    // Validate form
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    // Set loading state
    this.isLoading = true;

    // Prepare registration data (exclude confirmPassword)
    const { confirmPassword, ...registerData } = this.registerForm.value;

    // Call auth service to register
    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.success) {
          this.successMessage = response.message || 'Registration successful! Redirecting to dashboard...';

          // Redirect to dashboard after short delay
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 2000);
        } else {
          this.errorMessage = response.error || 'Registration failed. Please try again.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration error:', error);
        this.errorMessage = error.error?.message || 'An error occurred during registration. Please try again.';
      }
    });
  }

  /**
   * Mark all form controls as touched to trigger validation messages
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Get error message for a form field
   */
  getErrorMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (control.hasError('email') || control.hasError('invalidEmail')) {
      return 'Please enter a valid email address';
    }

    if (control.hasError('minlength')) {
      const minLength = control.errors['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
    }

    if (control.hasError('maxlength')) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} cannot exceed ${maxLength} characters`;
    }

    if (control.hasError('invalidName')) {
      return control.errors['invalidName'];
    }

    if (control.hasError('weakPassword')) {
      return control.errors['weakPassword'];
    }

    if (control.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }

    if (control.hasError('invalidPhone')) {
      return control.errors['invalidPhone'];
    }

    return '';
  }

  /**
   * Get field label for error messages
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      fullname: 'Full name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
      phone: 'Phone number',
      role: 'Role'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Check if field has error and is touched
   */
  hasError(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
