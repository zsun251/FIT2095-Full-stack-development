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

    .footer {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-top: 3px solid #0f3460;
    }

    h5, h6 {
      color: #e94560;
      font-weight: 600;
      border-bottom: 2px solid #0f3460;
      padding-bottom: 0.5rem;
    }

    .text-muted {
      color: #b8b8b8 !important;
    }

    a.text-muted:hover {
      color: #e94560 !important;
      transition: color 0.3s ease;
    }

    ul li {
      margin-bottom: 0.5rem;
    }
  `]
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
}
