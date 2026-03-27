import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  isOpen = signal<boolean>(false);
  message = signal<string>('');
  private resolveConfirm?: (value: boolean) => void;

  ask(message: string): Promise<boolean> {
    this.message.set(message);
    this.isOpen.set(true);
    return new Promise((resolve) => {
      this.resolveConfirm = resolve;
    });
  }

  handleResponse(result: boolean) {
    this.isOpen.set(false);
    if (this.resolveConfirm) {
      this.resolveConfirm(result);
    }
  }
}
