import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  totalMembers = signal<number>(0);
  activeMembers = signal<number>(0);
  totalRevenue = signal<number>(0);
  todayRevenue = signal<number>(0);
  loading = signal<boolean>(false);

  private router = inject(Router);
  private dashboardService = inject(DashboardService);

  // Mock data for Growth Graph
  growthData = signal<{month: string, value: number}[]>([
    { month: 'Oct', value: 45 },
    { month: 'Nov', value: 62 },
    { month: 'Dec', value: 58 },
    { month: 'Jan', value: 85 },
    { month: 'Feb', value: 92 },
    { month: 'Mar', value: 110 }
  ]);

  constructor() {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);
    
    this.dashboardService.getMemberCount().subscribe({
      next: (count) => this.totalMembers.set(count),
      error: (err) => console.error('Error loading member count', err)
    });

    this.dashboardService.getActiveMemberCount().subscribe({
      next: (count) => this.activeMembers.set(count),
      error: (err) => console.error('Error loading active count', err)
    });

    this.dashboardService.getTotalRevenue().subscribe({
      next: (rev) => this.totalRevenue.set(rev),
      error: (err) => console.error('Error loading total revenue', err)
    });

    this.dashboardService.getTodayRevenue().subscribe({
      next: (rev) => {
        this.todayRevenue.set(rev);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading today revenue', err);
        this.loading.set(false);
      }
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
