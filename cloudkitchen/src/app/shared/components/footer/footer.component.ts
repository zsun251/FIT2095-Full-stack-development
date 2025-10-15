import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styles: [`
    :host {
      display: block;
      flex-shrink: 0;
      margin-top: auto;
    }
  `]
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
  readonly studentName = 'Zhan Sun';
  readonly studentId = '';
  readonly assignmentNumber = 'Assignment 3';
}
