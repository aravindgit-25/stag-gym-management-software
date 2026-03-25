import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-wrapper">
      <!-- Sidebar -->
      <aside class="app-sidebar">
        <div class="sidebar-logo">STAG FITNESS</div>
        <nav class="sidebar-nav">
          <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a class="nav-item" routerLink="/members" routerLinkActive="active">Members</a>
          <a class="nav-item" routerLink="/plans" routerLinkActive="active">Plans</a>
          <a class="nav-item" routerLink="/subscriptions" routerLinkActive="active">Subscriptions</a>
          <a class="nav-item" routerLink="/payments" routerLinkActive="active">Payments</a>
        </nav>
      </aside>

      <!-- Top Header -->
      <header class="app-header">
        <div class="header-left">
          <span style="font-weight: 500; color: #718096;">Gym ERP Admin</span>
        </div>
        <div class="user-profile">
          <span>Aravind Kumar</span>
          <span class="user-role">Admin</span>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AppComponent {
  title = 'gym-management-ui';
}
