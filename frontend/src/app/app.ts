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
      <div class="sidebar-overlay" *ngIf="sidebarOpen()" (click)="closeSidebar()"></div>

      <ng-container *ngIf="!isInvoicePage">
        <aside class="app-sidebar" [class.open]="sidebarOpen()">
          <div class="sidebar-logo">
            <div class="mark"></div>
            STAG <strong>FITNESS</strong>
          </div>
          <nav class="sidebar-nav">
            <a *ngIf="authService.isAdmin()" class="nav-item" routerLink="/dashboard" routerLinkActive="active" (click)="closeSidebar()">
              <span class="nav-icon">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </span> Dashboard
            </a>
            <a class="nav-item" routerLink="/members" routerLinkActive="active" (click)="closeSidebar()">
              <span class="nav-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </span> Members
            </a>
            <a class="nav-item" routerLink="/plans" routerLinkActive="active" (click)="closeSidebar()">
              <span class="nav-icon">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </span> Plans
            </a>
            <a class="nav-item" routerLink="/subscriptions" routerLinkActive="active" (click)="closeSidebar()">
              <span class="nav-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </span> Subscriptions
            </a>
            <a *ngIf="authService.isAdmin()" class="nav-item" routerLink="/payments" routerLinkActive="active" (click)="closeSidebar()">
              <span class="nav-icon">
                <svg viewBox="0 0 24 24">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </span> Payments
            </a>
          </nav>
          
          <div class="sidebar-footer">
             <a class="nav-item logout-btn" (click)="authService.logout(); closeSidebar()">
               <span class="nav-icon">
                 <svg viewBox="0 0 24 24">
                   <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                   <polyline points="16 17 21 12 16 7"></polyline>
                   <line x1="21" y1="12" x2="9" y2="12"></line>
                 </svg>
               </span> Logout
             </a>
          </div>
        </aside>

        <header class="app-header">
          <div class="header-left">
            <div class="header-brand">
              <span class="brand-text">STAG FITNESS</span>
            </div>
          </div>
          <div class="user-profile">
            <div class="user-info">
              <span class="user-name">{{ authService.currentUser()?.name }}</span>
              <span class="user-role">{{ authService.currentUser()?.role | titlecase }}</span>
            </div>
            <div class="user-avatar">
              {{ authService.currentUser()?.name?.charAt(0) }}
            </div>
          </div>
        </header>
      </ng-container>

      <main [class.app-main]="!isInvoicePage" [class.full-width]="isInvoicePage">
        <router-outlet></router-outlet>
      </main>
    </div>

    <ng-template #loginView>
      <router-outlet></router-outlet>
    </ng-template>
  `,
  styles: [`
    .invoice-layout { display: block !important; }
    .full-width { width: 100%; min-height: 100vh; background: white; margin: 0; padding: 0; }
    
    .nav-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      color: var(--secondary-grey);
      transition: all 0.2s;
    }
    .nav-icon svg {
      width: 100%;
      height: 100%;
      stroke: currentColor;
      stroke-width: 2;
      fill: none;
    }
    .active .nav-icon {
      color: var(--accent-red);
    }
    
    .header-brand { display: flex; flex-direction: column; margin-left: 10px; }
    .brand-text { font-weight: 700; color: var(--text-main); font-size: 14px; letter-spacing: 0.5px; }
    .brand-status { font-size: 10px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
    
    .user-avatar {
      width: 40px;
      height: 40px;
      background: var(--bg-hover);
      border: 1px solid var(--border-medium);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: var(--text-main);
      font-size: 16px;
    }
    
    .sidebar-footer { margin-top: auto; padding: 20px 15px; border-top: 1px solid var(--border-light); }
    .logout-btn { color: var(--text-muted) !important; }
    .logout-btn:hover { background: var(--accent-red-light) !important; color: var(--accent-red) !important; }
    .logout-btn:hover .dot { background: var(--accent-red); }
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
