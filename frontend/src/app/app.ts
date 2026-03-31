import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { NotificationComponent } from './shared/components/notification/notification';
import { ConfirmComponent } from './shared/components/confirm/confirm';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationComponent, ConfirmComponent],
  template: `
    <app-notification></app-notification>
    <app-confirm></app-confirm>
    
    <div class="app-wrapper" [class.invoice-layout]="isInvoicePage" *ngIf="authService.isLoggedIn(); else loginView">
      <!-- Sidebar Overlay for Mobile -->
      <div class="sidebar-overlay" *ngIf="sidebarOpen()" (click)="closeSidebar()"></div>

      <!-- Only show sidebar/header if NOT on invoice page -->
      <ng-container *ngIf="!isInvoicePage">
        <!-- Sidebar -->
        <aside class="app-sidebar" [class.open]="sidebarOpen()">
          <div class="sidebar-logo">STAG FITNESS</div>
          <nav class="sidebar-nav">
            <a *ngIf="authService.isAdmin()" class="nav-item" routerLink="/dashboard" routerLinkActive="active" (click)="closeSidebar()">Dashboard</a>
            <a class="nav-item" routerLink="/members" routerLinkActive="active" (click)="closeSidebar()">Members</a>
            <a class="nav-item" routerLink="/plans" routerLinkActive="active" (click)="closeSidebar()">Plans</a>
            <a class="nav-item" routerLink="/subscriptions" routerLinkActive="active" (click)="closeSidebar()">Subscriptions</a>
            <a *ngIf="authService.isAdmin()" class="nav-item" routerLink="/payments" routerLinkActive="active" (click)="closeSidebar()">Payments</a>
          </nav>
          
          <div class="sidebar-footer">
             <a class="nav-item logout-btn" (click)="authService.logout(); closeSidebar()">Logout</a>
          </div>
        </aside>

        <!-- Top Header -->
        <header class="app-header">
          <div class="header-left">
            <button class="menu-toggle" (click)="toggleSidebar()">☰</button>
            <span style="font-weight: 500; color: #718096;">Fitness Management</span>
          </div>
          <div class="user-profile">
            <span>{{ authService.currentUser()?.name }}</span>
            <span class="user-role">{{ authService.currentUser()?.role }}</span>
          </div>
        </header>
      </ng-container>

      <!-- Main Content Area -->
      <main [class.app-main]="!isInvoicePage" [class.full-width]="isInvoicePage">
        <router-outlet></router-outlet>
      </main>
    </div>

    <ng-template #loginView>
      <router-outlet></router-outlet>
    </ng-template>
  `,
  styles: [`
    .invoice-layout {
      display: block !important;
      grid-template-columns: 1fr !important;
    }
    .full-width {
      width: 100%;
      min-height: 100vh;
      background: white;
      margin: 0;
      padding: 0;
    }
    .sidebar-footer {
      margin-top: auto;
      padding-bottom: 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .logout-btn {
      color: #feb2b2 !important;
    }
    .logout-btn:hover {
      background: rgba(245, 101, 101, 0.1) !important;
    }
  `]
})
export class AppComponent {
  isInvoicePage = false;
  sidebarOpen = signal<boolean>(false);
  private router = inject(Router);

  constructor(public authService: AuthService) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isInvoicePage = event.url.includes('/invoice/');
    });
  }

  toggleSidebar() {
    this.sidebarOpen.update(val => !val);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }
}
