import { Component, inject } from '@angular/core';
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
    
    <div class="app-wrapper" *ngIf="authService.isLoggedIn(); else loginView">
      <!-- Only show sidebar/header if NOT on invoice page -->
      <ng-container *ngIf="!isInvoicePage">
        <!-- Sidebar -->
        <aside class="app-sidebar">
          <div class="sidebar-logo">STAG FITNESS</div>
          <nav class="sidebar-nav">
            <a *ngIf="authService.isAdmin()" class="nav-item" routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
            <a class="nav-item" routerLink="/members" routerLinkActive="active">Members</a>
            <a class="nav-item" routerLink="/plans" routerLinkActive="active">Plans</a>
            <a class="nav-item" routerLink="/subscriptions" routerLinkActive="active">Subscriptions</a>
            <a *ngIf="authService.isAdmin()" class="nav-item" routerLink="/payments" routerLinkActive="active">Payments</a>
          </nav>
          
          <div class="sidebar-footer">
             <a class="nav-item logout-btn" (click)="authService.logout()">Logout</a>
          </div>
        </aside>

        <!-- Top Header -->
        <header class="app-header">
          <div class="header-left">
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
    .full-width {
      width: 100%;
      height: 100vh;
      background: white;
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
  private router = inject(Router);

  constructor(public authService: AuthService) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isInvoicePage = event.url.includes('/invoice/');
    });
  }
}
