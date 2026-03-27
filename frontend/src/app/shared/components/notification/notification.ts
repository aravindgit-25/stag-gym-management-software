import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      <div *ngFor="let n of notificationService.notifications()" 
           [class]="'notification ' + n.type"
           (click)="notificationService.remove(n.id)">
        <div class="notif-icon">
          <span *ngIf="n.type === 'success'">✓</span>
          <span *ngIf="n.type === 'error'">✕</span>
        </div>
        <div class="notif-content">
          {{ n.message }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 350px;
      width: calc(100% - 40px);
    }
    .notification {
      display: flex;
      align-items: center;
      padding: 16px;
      border-radius: 10px;
      color: white;
      font-weight: 500;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      cursor: pointer;
      animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      word-break: break-word;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .notif-icon {
      margin-right: 12px;
      font-size: 18px;
      height: 24px;
      width: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      flex-shrink: 0;
    }
    .notif-content {
      flex: 1;
      font-size: 14px;
      line-height: 1.4;
    }
    .success { background-color: #10b981; }
    .error { background-color: #ef4444; }
    
    @keyframes slideIn {
      from { transform: translateX(120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class NotificationComponent {
  notificationService = inject(NotificationService);
}
