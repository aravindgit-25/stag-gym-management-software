import { Component, inject, signal, HostListener } from '@angular/core';
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
            
            <div class="nav-group" [class.expanded]="membersMenuOpen()">
              <a class="nav-item has-submenu" (click)="toggleMembersMenu($event)">
                <span class="nav-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </span> Members
                <span class="chevron">
                  <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </span>
              </a>
              <div class="sub-nav">
                <a class="sub-nav-item" routerLink="/members" [queryParams]="{filter: 'all'}" routerLinkActive="active" [routerLinkActiveOptions]="{exact: false}" (click)="closeSidebar()">
                  All Members
                </a>
                <a class="sub-nav-item" routerLink="/members" [queryParams]="{action: 'add'}" (click)="closeSidebar()">
                  Add Member
                </a>
                <a class="sub-nav-item" routerLink="/members" [queryParams]="{filter: 'active'}" routerLinkActive="active" (click)="closeSidebar()">
                  Active Members
                </a>
                <a class="sub-nav-item" routerLink="/members" [queryParams]="{filter: 'inactive'}" routerLinkActive="active" (click)="closeSidebar()">
                  Inactive Members
                </a>
                <a class="sub-nav-item" routerLink="/members" [queryParams]="{filter: 'expiring'}" routerLinkActive="active" (click)="closeSidebar()">
                  Expiring Soon
                </a>
              </div>
            </div>

            <div class="nav-group" [class.expanded]="leadsMenuOpen()">
              <a class="nav-item has-submenu" (click)="toggleLeadsMenu($event)">
                <span class="nav-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <polyline points="17 11 19 13 23 9"></polyline>
                  </svg>
                </span> Leads
                <span class="chevron">
                  <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </span>
              </a>
              <div class="sub-nav">
                <a class="sub-nav-item" routerLink="/leads" [queryParams]="{filter: 'all'}" routerLinkActive="active" [routerLinkActiveOptions]="{exact: false}" (click)="closeSidebar()">
                  All Leads
                </a>
                <a class="sub-nav-item" routerLink="/leads" [queryParams]="{action: 'add'}" (click)="closeSidebar()">
                  Add Lead
                </a>
                <a class="sub-nav-item" routerLink="/leads" [queryParams]="{filter: 'followup'}" routerLinkActive="active" (click)="closeSidebar()">
                  Follow-ups
                </a>
                <a class="sub-nav-item" routerLink="/leads" [queryParams]="{filter: 'rejected'}" routerLinkActive="active" (click)="closeSidebar()">
                  Rejected
                </a>
              </div>
            </div>

            <div class="nav-group" [class.expanded]="staffMenuOpen()">
              <a class="nav-item has-submenu" (click)="toggleStaffMenu($event)">
                <span class="nav-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </span> Staff
                <span class="chevron">
                  <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </span>
              </a>
              <div class="sub-nav">
                <a class="sub-nav-item" routerLink="/staff" [queryParams]="{filter: 'all'}" routerLinkActive="active" [routerLinkActiveOptions]="{exact: false}" (click)="closeSidebar()">
                  All Staff
                </a>
                <a class="sub-nav-item" routerLink="/staff" [queryParams]="{action: 'add'}" (click)="closeSidebar()">
                  Add Staff
                </a>
                <a class="sub-nav-item" routerLink="/staff" [queryParams]="{filter: 'active'}" routerLinkActive="active" (click)="closeSidebar()">
                  Active Staff
                </a>
                <a class="sub-nav-item" routerLink="/staff" [queryParams]="{filter: 'archive'}" routerLinkActive="active" (click)="closeSidebar()">
                  Archive (Terminated)
                </a>
              </div>
            </div>

            <a class="nav-item" routerLink="/attendance" routerLinkActive="active" (click)="closeSidebar()">
              <span class="nav-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </span> Attendance
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
            <button class="menu-toggle" (click)="toggleSidebar($event)">
              <svg viewBox="0 0 24 24">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <!-- Redundant brand text removed from header as requested -->
          </div>
          
          <div class="user-profile-wrapper">
            <div class="user-profile" (click)="toggleUserDropdown($event)">
              <div class="user-avatar">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" stroke-width="2"></path>
                  <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2"></circle>
                </svg>
              </div>
            </div>

            <div class="user-dropdown" *ngIf="userDropdownOpen()" (click)="$event.stopPropagation()">
              <div class="dropdown-header">
                <span class="user-name">{{ authService.currentUser()?.name }}</span>
                <span class="user-email">{{ authService.currentUser()?.email }}</span>
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-items">
                <button class="dropdown-item">
                  <span class="item-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </span>
                  Change Password
                </button>
                <button class="dropdown-item exit-btn" (click)="authService.logout(); closeUserDropdown()">
                  <span class="item-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                  </span>
                  Exit
                </button>
              </div>
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

    .nav-group {
      display: flex;
      flex-direction: column;
    }

    .has-submenu {
      justify-content: space-between !important;
    }

    .chevron {
      width: 16px;
      height: 16px;
      transition: transform 0.3s;
    }

    .expanded .chevron {
      transform: rotate(180deg);
    }

    .sub-nav {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;
      background: var(--bg-subtle);
      border-radius: 8px;
      margin: 0 10px;
    }

    .expanded .sub-nav {
      max-height: 200px;
      margin-bottom: 10px;
    }

    .sub-nav-item {
      display: block;
      padding: 10px 15px 10px 45px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      text-decoration: none;
      transition: all 0.2s;
      border-radius: 6px;
    }

    .sub-nav-item:hover {
      color: var(--accent-red);
      background: var(--bg-hover);
    }

    .sub-nav-item.active {
      color: var(--accent-red);
      background: var(--accent-red-light);
    }
    
    .user-profile-wrapper {
      position: relative;
    }
    
    .user-profile {
      cursor: pointer;
      padding: 5px;
      border-radius: 50%;
      transition: all 0.2s;
    }
    
    .user-profile:hover {
      background: var(--bg-hover);
    }
    
    .user-avatar {
      width: 40px;
      height: 40px;
      background: var(--bg-hover);
      border: 1px solid var(--border-medium);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--secondary-grey);
      transition: all 0.2s;
    }
    
    .user-profile:hover .user-avatar {
      color: var(--accent-red);
      border-color: var(--accent-red);
    }

    .user-dropdown {
      position: absolute;
      top: 120%;
      right: 0;
      width: 240px;
      background: white;
      border: 1px solid var(--border-medium);
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      z-index: 1001;
      overflow: hidden;
      animation: dropdownIn 0.2s ease-out;
    }

    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dropdown-header {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .user-name {
      font-weight: 700;
      color: var(--text-main);
      font-size: 15px;
    }

    .user-email {
      font-size: 13px;
      color: var(--text-muted);
    }

    .dropdown-divider {
      height: 1px;
      background: var(--border-light);
    }

    .dropdown-items {
      padding: 8px;
    }

    .dropdown-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border: none;
      background: none;
      border-radius: 8px;
      color: var(--secondary-grey);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .dropdown-item:hover {
      background: var(--bg-hover);
      color: var(--text-main);
    }

    .exit-btn:hover {
      color: var(--accent-red);
      background: var(--accent-red-light);
    }

    .item-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: inherit;
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
  membersMenuOpen = signal<boolean>(false);
  leadsMenuOpen = signal<boolean>(false);
  staffMenuOpen = signal<boolean>(false);
  userDropdownOpen = signal<boolean>(false);
  private router = inject(Router);

  constructor(public authService: AuthService) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isInvoicePage = event.url.includes('/invoice/');
      // Auto-open menus based on route
      if (event.url.includes('/members')) this.membersMenuOpen.set(true);
      if (event.url.includes('/leads')) this.leadsMenuOpen.set(true);
      if (event.url.includes('/staff')) this.staffMenuOpen.set(true);
    });
  }

  toggleMembersMenu(event: Event) {
    event.stopPropagation();
    this.membersMenuOpen.update(val => !val);
  }

  toggleLeadsMenu(event: Event) {
    event.stopPropagation();
    this.leadsMenuOpen.update(val => !val);
  }

  toggleStaffMenu(event: Event) {
    event.stopPropagation();
    this.staffMenuOpen.update(val => !val);
  }

  @HostListener('window:click')
  onWindowClick() {
    this.userDropdownOpen.set(false);
  }

  toggleSidebar(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.sidebarOpen.update(val => !val);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  toggleUserDropdown(event: Event) {
    event.stopPropagation();
    this.userDropdownOpen.update(val => !val);
  }

  closeUserDropdown() {
    this.userDropdownOpen.set(false);
  }
}
