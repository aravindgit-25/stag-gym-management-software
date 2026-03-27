import { Injectable, signal } from '@angular/core';

export interface Notification {
  message: string;
  type: 'success' | 'error';
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notifications = signal<Notification[]>([]);
  private nextId = 0;

  show(message: string, type: 'success' | 'error' = 'success') {
    const id = this.nextId++;
    const newNotif = { message, type, id };
    
    this.notifications.update(prev => [...prev, newNotif]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      this.remove(id);
    }, 3000);
  }

  remove(id: number) {
    this.notifications.update(prev => prev.filter(n => n.id !== id));
  }
}
