import { Component, inject, signal, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { BranchService } from './services/branch.service';
import { Branch } from './models/branch.model';
import { NotificationComponent } from './shared/components/notification/notification';
import { ConfirmComponent } from './shared/components/confirm/confirm';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { AppModalComponent } from './shared/components/app-modal/app-modal';
import { NotificationService } from './services/notification.service';
import { ConfirmService } from './services/confirm.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NotificationComponent,
    ConfirmComponent,
    FormsModule,
    ReactiveFormsModule,
    AppModalComponent,
  ],
  template: `
    <app-notification></app-notification>
    <app-confirm></app-confirm>

    <div
      class="app-wrapper"
      [class.invoice-layout]="isInvoicePage"
      *ngIf="authService.isLoggedIn(); else loginView"
    >
      <div class="sidebar-overlay" *ngIf="sidebarOpen()" (click)="closeSidebar()"></div>

      <ng-container *ngIf="!isInvoicePage">
        <aside class="app-sidebar" [class.open]="sidebarOpen()">
          <div class="sidebar-logo">
            <div class="mark"></div>
            STAG <strong>GYM</strong>
          </div>
          <nav class="sidebar-nav">
            <a
              *ngIf="authService.isOwner()"
              class="nav-item"
              routerLink="/dashboard"
              routerLinkActive="active"
              (click)="closeSidebar()"
            >
              <span class="nav-icon">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </span>
              Dashboard
            </a>

            <!-- Manage Branches Link -->
            <a
              *ngIf="authService.isOwner()"
              class="nav-item"
              (click)="openBranchModal(); closeSidebar()"
            >
              <span class="nav-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </span>
              Manage Branches
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
                </span>
                Members
                <span class="chevron">
                  <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </span>
              </a>
              <div class="sub-nav">
                <a
                  class="sub-nav-item"
                  routerLink="/members"
                  [queryParams]="{ filter: 'all' }"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: false }"
                  (click)="closeSidebar()"
                >
                  All Members
                </a>
                <a
                  class="sub-nav-item"
                  routerLink="/members"
                  [queryParams]="{ action: 'add' }"
                  (click)="closeSidebar()"
                >
                  Add Member
                </a>
                <a
                  class="sub-nav-item"
                  routerLink="/members"
                  [queryParams]="{ filter: 'active' }"
                  routerLinkActive="active"
                  (click)="closeSidebar()"
                >
                  Active Members
                </a>
                <a
                  class="sub-nav-item"
                  routerLink="/members"
                  [queryParams]="{ filter: 'inactive' }"
                  routerLinkActive="active"
                  (click)="closeSidebar()"
                >
                  Inactive Members
                </a>
                <a
                  class="sub-nav-item"
                  routerLink="/members"
                  [queryParams]="{ filter: 'expiring' }"
                  routerLinkActive="active"
                  (click)="closeSidebar()"
                >
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
                </span>
                Leads
                <span class="chevron">
                  <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </span>
              </a>
              <div class="sub-nav">
                <a
                  class="sub-nav-item"
                  routerLink="/leads"
                  [queryParams]="{ filter: 'all' }"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: false }"
                  (click)="closeSidebar()"
                >
                  All Leads
                </a>
                <a
                  class="sub-nav-item"
                  routerLink="/leads"
                  [queryParams]="{ action: 'add' }"
                  (click)="closeSidebar()"
                >
                  Add Lead
                </a>
                <a
                  class="sub-nav-item"
                  routerLink="/leads"
                  [queryParams]="{ filter: 'followup' }"
                  routerLinkActive="active"
                  (click)="closeSidebar()"
                >
                  Follow-ups
                </a>
                <a
                  class="sub-nav-item"
                  routerLink="/leads"
                  [queryParams]="{ filter: 'rejected' }"
                  routerLinkActive="active"
                  (click)="closeSidebar()"
                >
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
                </span>
                Staff
                <span class="chevron">
                  <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </span>
              </a>
              <div class="sub-nav">
                <a
                  class="sub-nav-item"
                  routerLink="/staff"
                  [queryParams]="{ filter: 'all' }"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: false }"
                  (click)="closeSidebar()"
                >
                  All Staff
                </a>
                <a
                  class="sub-nav-item"
                  routerLink="/staff"
                  [queryParams]="{ action: 'add' }"
                  (click)="closeSidebar()"
                >
                  Add Staff
                </a>
                <a
                  class="sub-nav-item"
                  routerLink="/staff"
                  [queryParams]="{ filter: 'active' }"
                  routerLinkActive="active"
                  (click)="closeSidebar()"
                >
                  Active Staff
                </a>
                <a
                  class="sub-nav-item"
                  routerLink="/staff"
                  [queryParams]="{ filter: 'archive' }"
                  routerLinkActive="active"
                  (click)="closeSidebar()"
                >
                  Archive (Terminated)
                </a>
                <a
                  class="sub-nav-item"
                  routerLink="/salary"
                  routerLinkActive="active"
                  (click)="closeSidebar()"
                >
                  Payroll & Salary
                </a>
              </div>
            </div>

            <a
              class="nav-item"
              routerLink="/attendance"
              routerLinkActive="active"
              (click)="closeSidebar()"
            >
              <span class="nav-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </span>
              Attendance
            </a>

            <a
              class="nav-item"
              routerLink="/diet-plans"
              routerLinkActive="active"
              (click)="closeSidebar()"
            >
              <span class="nav-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                  <line x1="6" y1="1" x2="6" y2="4"></line>
                  <line x1="10" y1="1" x2="10" y2="4"></line>
                  <line x1="14" y1="1" x2="14" y2="4"></line>
                </svg>
              </span>
              Diet Plans
            </a>

            <a
              class="nav-item"
              routerLink="/plans"
              routerLinkActive="active"
              (click)="closeSidebar()"
            >
              <span class="nav-icon">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </span>
              Plans
            </a>
            <a
              *ngIf="authService.isOwner()"
              class="nav-item"
              routerLink="/payments"
              routerLinkActive="active"
              (click)="closeSidebar()"
            >
              <span class="nav-icon">
                <svg viewBox="0 0 24 24">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </span>
              Accounts & Finance
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
              </span>
              Logout
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

            <div class="branch-switcher" *ngIf="authService.isOwner()">
              <select
                [ngModel]="authService.selectedBranchId()"
                (ngModelChange)="onBranchChange($event)"
                class="branch-select"
              >
                <option [ngValue]="null">🏢 All Branches</option>
                <option *ngFor="let b of branches()" [value]="b.id">📍 {{ b.branchName }}</option>
              </select>
            </div>

            <div class="fixed-branch-info" *ngIf="authService.isTrainer()">
              <span class="branch-tag">
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {{ getTrainerBranchName() }}
              </span>
            </div>
          </div>

          <div class="user-profile-wrapper">
            <div class="user-profile" (click)="toggleUserDropdown($event)">
              <div class="user-avatar">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path
                    d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  ></path>
                  <circle
                    cx="12"
                    cy="7"
                    r="4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  ></circle>
                </svg>
              </div>
            </div>

            <div
              class="user-dropdown"
              *ngIf="userDropdownOpen()"
              (click)="$event.stopPropagation()"
            >
              <div class="dropdown-header">
                <span class="user-name">{{ authService.currentUser()?.name }}</span>
                <div class="user-role-badge" [class.owner]="authService.isOwner()">
                  {{ authService.currentUser()?.role }}
                </div>
                <span class="user-email">{{ authService.currentUser()?.email }}</span>
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-items">
                <button
                  class="dropdown-item exit-btn"
                  (click)="authService.logout(); closeUserDropdown()"
                >
                  <span class="item-icon">
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                  </span>
                  Sign Out
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

    <!-- Branch Management Modal -->
    <app-modal
      [isOpen]="branchModalOpen()"
      title="Manage Gym Branches"
      (close)="closeBranchModal()"
      width="600px"
    >
      <div class="branch-mgmt-container">
        <form [formGroup]="branchForm" (ngSubmit)="addBranch()" class="branch-add-form">
          <div class="form-row">
            <div class="form-col">
              <label>Branch Name</label>
              <input type="text" formControlName="branchName" placeholder="e.g. Saravanampatti" />
            </div>
            <div class="form-col">
              <label>Location</label>
              <input type="text" formControlName="location" placeholder="e.g. Coimbatore North" />
            </div>
          </div>
          <div class="form-row mt-12">
            <div class="form-col">
              <label>Branch Login Email</label>
              <input
                type="email"
                formControlName="email"
                placeholder="e.g. saravanampatti@stag.com"
              />
            </div>
            <div class="form-col">
              <label>Branch Password</label>
              <input type="text" formControlName="password" placeholder="Min 6 characters" />
            </div>
            <div class="form-col-btn">
              <button type="submit" [disabled]="branchForm.invalid" class="btn-add-branch">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add
              </button>
            </div>
          </div>
          <p class="form-hint">
            * Creating a branch will automatically generate a staff login with these credentials.
          </p>
        </form>

        <div class="branch-list">
          <div class="branch-card" *ngFor="let b of branches()">
            <div class="branch-card-main">
              <div class="branch-info">
                <span class="b-name">{{ b.branchName }}</span>
                <span class="b-loc">{{ b.location }}</span>
              </div>
              <button class="btn-delete-branch" (click)="deleteBranch(b.id)" title="Delete Branch">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path
                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  ></path>
                </svg>
              </button>
            </div>
            <div class="branch-credentials">
              <div class="cred-item">
                <span class="cred-label">Login:</span>
                <span class="cred-value">{{ b.email || 'Not set' }}</span>
              </div>
              <div class="cred-item">
                <span class="cred-label">Pass:</span>
                <span class="cred-value password-field">
                  {{ viewingPasswordId() === b.id ? b.password || '******' : '••••••••' }}
                </span>
                <button class="btn-view-pass" (click)="togglePassword(b.id!)">
                  <svg
                    *ngIf="viewingPasswordId() !== b.id"
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <svg
                    *ngIf="viewingPasswordId() === b.id"
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                  >
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                    ></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div *ngIf="branches().length === 0" class="empty-state">No branches added yet.</div>
        </div>
      </div>
    </app-modal>
  `,
  styles: [
    `
      .invoice-layout {
        display: block !important;
      }
      .full-width {
        width: 100%;
        min-height: 100vh;
        background: white;
        margin: 0;
        padding: 0;
      }

      .branch-mgmt-container {
        padding: 10px;
      }
      .branch-add-form {
        background: #f8fafc;
        padding: 15px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        margin-bottom: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
      }
      .form-row {
        display: flex;
        gap: 15px;
        align-items: flex-end;
      }
      .mt-12 {
        margin-top: 12px;
      }
      .form-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .form-col label {
        font-size: 11px;
        font-weight: 800;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .form-col input {
        padding: 9px 12px;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        transition: all 0.2s;
        background: white;
      }
      .form-col input:focus {
        border-color: var(--accent-red);
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
      }
      .form-hint {
        font-size: 11px;
        color: #94a3b8;
        margin-top: 12px;
        font-style: italic;
      }
      .btn-add-branch {
        background: var(--accent-red);
        color: white;
        border: none;
        padding: 0 20px;
        border-radius: 8px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: all 0.2s;
        height: 38px;
      }
      .btn-add-branch:hover:not(:disabled) {
        background: #b91c1c;
        transform: translateY(-1px);
      }
      .btn-add-branch:disabled {
        background: #cbd5e1;
        cursor: not-allowed;
      }

      .branch-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: 350px;
        overflow-y: auto;
        padding-right: 5px;
      }
      .branch-card {
        background: white;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.2s;
      }
      .branch-card:hover {
        border-color: #cbd5e1;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      }
      .branch-card-main {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 15px;
        background: #fff;
      }
      .branch-info {
        display: flex;
        flex-direction: column;
      }
      .b-name {
        font-weight: 800;
        color: var(--text-main);
        font-size: 15px;
      }
      .b-loc {
        font-size: 12px;
        color: var(--text-muted);
        font-weight: 500;
      }

      .branch-credentials {
        display: flex;
        gap: 20px;
        padding: 8px 15px;
        background: #f1f5f9;
        border-top: 1px solid #e2e8f0;
      }
      .cred-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }
      .cred-label {
        color: #64748b;
        font-weight: 700;
      }
      .cred-value {
        color: #334155;
        font-weight: 600;
        font-family: 'Monaco', 'Consolas', monospace;
      }
      .password-field {
        min-width: 70px;
      }
      .btn-view-pass {
        background: none;
        border: none;
        padding: 4px;
        color: #94a3b8;
        cursor: pointer;
        display: flex;
        align-items: center;
        border-radius: 4px;
      }
      .btn-view-pass:hover {
        color: var(--accent-red);
        background: #e2e8f0;
      }

      .btn-delete-branch {
        background: #fee2e2;
        color: #ef4444;
        border: none;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .btn-delete-branch:hover {
        background: #ef4444;
        color: white;
      }
      .empty-state {
        text-align: center;
        padding: 30px;
        color: #94a3b8;
        font-style: italic;
        background: #f8fafc;
        border-radius: 12px;
        border: 2px dashed #e2e8f0;
      }

      .branch-switcher {
        margin-left: 20px;
      }
      .branch-select {
        background: #f8fafc;
        border: 1px solid var(--border-medium);
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 700;
        color: var(--text-main);
        cursor: pointer;
        outline: none;
        transition: all 0.2s;
      }
      .branch-select:hover {
        border-color: var(--accent-red);
        background: white;
      }

      .fixed-branch-info {
        margin-left: 20px;
      }
      .branch-tag {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #fff1f2;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 700;
        color: var(--accent-red);
      }

      .user-role-badge {
        display: inline-block;
        font-size: 10px;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 4px;
        background: #e2e8f0;
        color: #475569;
        width: fit-content;
        margin: 4px 0;
      }
      .user-role-badge.owner {
        background: #fee2e2;
        color: #b91c1c;
      }

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
        max-height: 250px;
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
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        z-index: 1001;
        overflow: hidden;
        animation: dropdownIn 0.2s ease-out;
      }

      @keyframes dropdownIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
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

      .sidebar-footer {
        margin-top: auto;
        padding: 20px 15px;
        border-top: 1px solid var(--border-light);
      }
      .logout-btn {
        color: var(--text-muted) !important;
        cursor: pointer;
        border-radius: 8px;
      }
      .logout-btn:hover {
        background: var(--accent-red-light) !important;
        color: var(--accent-red) !important;
      }
    `,
  ],
})
export class AppComponent {
  isInvoicePage = false;
  sidebarOpen = signal<boolean>(false);
  membersMenuOpen = signal<boolean>(false);
  leadsMenuOpen = signal<boolean>(false);
  staffMenuOpen = signal<boolean>(false);
  userDropdownOpen = signal<boolean>(false);

  // Branch Management
  branchModalOpen = signal<boolean>(false);
  branchForm: FormGroup;
  branches = signal<Branch[]>([]);
  viewingPasswordId = signal<number | null>(null);

  private router = inject(Router);
  public authService = inject(AuthService);
  private branchService = inject(BranchService);
  private fb = inject(FormBuilder);
  private notif = inject(NotificationService);
  private confirm = inject(ConfirmService);

  constructor() {
    this.branchForm = this.fb.group({
      branchName: ['', Validators.required],
      location: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isInvoicePage = event.url.includes('/invoice/');
        // Auto-open menus based on route
        if (event.url.includes('/members')) this.membersMenuOpen.set(true);
        if (event.url.includes('/leads')) this.leadsMenuOpen.set(true);
        if (event.url.includes('/staff') || event.url.includes('/salary'))
          this.staffMenuOpen.set(true);
      });

    if (this.authService.isLoggedIn()) {
      this.loadBranches();
    }
  }

  loadBranches() {
    this.branchService.getBranches().subscribe({
      next: (data) => this.branches.set(data),
      error: () => console.error('Failed to load branches'),
    });
  }

  // Branch Methods
  openBranchModal() {
    this.branchModalOpen.set(true);
    this.loadBranches();
  }

  closeBranchModal() {
    this.branchModalOpen.set(false);
    this.branchForm.reset();
  }

  addBranch() {
    if (this.branchForm.valid) {
      const { branchName, location, email, password } = this.branchForm.value;

      this.branchService.createBranch({ branchName, location, email, password }).subscribe({
        next: () => {
          this.notif.show('Branch and Login created successfully!', 'success');
          this.branchForm.reset();
          this.loadBranches();
        },
        error: () => this.notif.show('Failed to create branch.', 'error'),
      });
    }
  }

  deleteBranch(id: number) {
    this.confirm.ask('Are you sure you want to delete this branch?').then((ok) => {
      if (ok) {
        this.branchService.deleteBranch(id).subscribe({
          next: () => {
            this.notif.show('Branch deleted.', 'success');
            this.loadBranches();
          },
          error: () => this.notif.show('Failed to delete branch.', 'error'),
        });
      }
    });
  }

  togglePassword(id: number) {
    if (this.viewingPasswordId() === id) {
      this.viewingPasswordId.set(null);
    } else {
      // Fetch fresh credentials from backend (User table)
      this.branchService.getBranchCredentials(id).subscribe({
        next: (creds) => {
          // Find the branch and update its local password for display
          this.branches.update((list) =>
            list.map((b) =>
              b.id === id ? { ...b, password: creds.password, email: creds.email } : b,
            ),
          );
          this.viewingPasswordId.set(id);
        },
        error: () => {
          this.notif.show('Could not fetch credentials from server.', 'error');
          // Set to true anyway if we want to show existing local data, but better to keep null
        },
      });
    }
  }

  onBranchChange(id: any) {
    const branchId = id ? Number(id) : null;
    this.authService.setBranch(branchId);
    window.location.reload();
  }

  getTrainerBranchName(): string {
    const bId = this.authService.getBranchId();
    return this.branches().find((b) => b.id === bId)?.branchName || 'Assigned Branch';
  }

  toggleMembersMenu(event: Event) {
    event.stopPropagation();
    this.membersMenuOpen.update((val) => !val);
  }

  toggleLeadsMenu(event: Event) {
    event.stopPropagation();
    this.leadsMenuOpen.update((val) => !val);
  }

  toggleStaffMenu(event: Event) {
    event.stopPropagation();
    this.staffMenuOpen.update((val) => !val);
  }

  @HostListener('window:click')
  onWindowClick() {
    this.userDropdownOpen.set(false);
  }

  toggleSidebar(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.sidebarOpen.update((val) => !val);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  toggleUserDropdown(event: Event) {
    event.stopPropagation();
    this.userDropdownOpen.update((val) => !val);
  }

  closeUserDropdown() {
    this.userDropdownOpen.set(false);
  }
}
