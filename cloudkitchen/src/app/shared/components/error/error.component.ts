import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Error 404 Component (Page Not Found)
 * Displays when user navigates to an invalid route
 */
@Component({
  selector: 'app-error',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './error.component.html'
})
export class ErrorComponent {
}
