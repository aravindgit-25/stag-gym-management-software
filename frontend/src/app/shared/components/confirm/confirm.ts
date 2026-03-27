import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../../services/confirm.service';
import { AppButtonComponent } from '../app-button/app-button';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  template: `
    <div class="confirm-overlay" *ngIf="confirmService.isOpen()">
      <div class="confirm-modal">
        <div class="confirm-header">
          <h3>Confirmation</h3>
        </div>
        <div class="confirm-body">
          {{ confirmService.message() }}
        </div>
        <div class="confirm-footer">
          <app-button label="No" variant="secondary" (onClick)="confirmService.handleResponse(false)"></app-button>
          <app-button label="Yes, Proceed" variant="primary" (onClick)="confirmService.handleResponse(true)"></app-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 100000;
      backdrop-filter: blur(2px);
    }
    .confirm-modal {
      background: white;
      padding: 24px;
      border-radius: 12px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
      text-align: center;
    }
    .confirm-header h3 {
      margin: 0 0 15px 0;
      color: #2d3748;
      font-size: 18px;
    }
    .confirm-body {
      color: #4a5568;
      margin-bottom: 25px;
      font-size: 15px;
      line-height: 1.5;
    }
    .confirm-footer {
      display: flex;
      justify-content: center;
      gap: 12px;
    }
  `]
})
export class ConfirmComponent {
  confirmService = inject(ConfirmService);
}
