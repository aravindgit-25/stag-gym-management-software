import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
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

  // SVG Points for Line Graph
  svgPoints = computed(() => {
    const data = this.growthData();
    const width = 1000;
    const height = 200;
    const maxVal = 150;
    
    return data.map((item, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - (item.value / maxVal) * height;
      return `${x},${y}`;
    }).join(' ');
  });

  // SVG Area points (for shaded area under the line)
  svgAreaPoints = computed(() => {
    const points = this.svgPoints();
    return `0,200 ${points} 1000,200`;
  });

  constructor() {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);
    
    forkJoin({
      totalMembers: this.dashboardService.getMemberCount().pipe(catchError(() => of(0))),
      activeMembers: this.dashboardService.getActiveMemberCount().pipe(catchError(() => of(0))),
      totalRevenue: this.dashboardService.getTotalRevenue().pipe(catchError(() => of(0))),
      todayRevenue: this.dashboardService.getTodayRevenue().pipe(catchError(() => of(0)))
    }).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe(result => {
      this.totalMembers.set(result.totalMembers);
      this.activeMembers.set(result.activeMembers);
      this.totalRevenue.set(result.totalRevenue);
      this.todayRevenue.set(result.todayRevenue);
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
