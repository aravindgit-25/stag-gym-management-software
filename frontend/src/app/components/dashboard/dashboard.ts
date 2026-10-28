import { Component, OnInit, signal, inject, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  totalMembers = signal<number>(0);
  activeMembers = signal<number>(0);
  totalRevenue = signal<number>(0);
  todayRevenue = signal<number>(0);
  loading = signal<boolean>(false);

  private router = inject(Router);
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  currentUser = this.authService.currentUser;
  private branchSub?: Subscription;

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

  // Bar dimensions for Digital Bar Chart
  svgBars = computed(() => {
    const data = this.growthData();
    const width = 1000;
    const height = 200;
    const maxVal = 150;
    const barWidth = 50;
    
    return data.map((item, index) => {
      const centerX = (index / (data.length - 1)) * width;
      const h = (item.value / maxVal) * height;
      return {
        x: centerX - barWidth / 2,
        y: height - h,
        w: barWidth,
        h: h,
        value: item.value
      };
    });
  });

  // Structured points for the template
  chartPoints = computed(() => {
    const data = this.growthData();
    const width = 1000;
    const height = 200;
    const maxVal = 150;
    
    return data.map((item, index) => ({
      x: (index / (data.length - 1)) * width,
      y: height - (item.value / maxVal) * height,
      value: item.value
    }));
  });

  // Curved Path for Smooth Area Chart
  svgCurvePath = computed(() => {
    const points = this.chartPoints();
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`;
    }
    
    return path;
  });

  svgCurveAreaPath = computed(() => {
    const curve = this.svgCurvePath();
    if (!curve) return '';
    return `${curve} L 1000,200 L 0,200 Z`;
  });

  constructor() {}

  ngOnInit(): void {
    // Listen for branch changes and reload stats
    this.branchSub = this.authService.branchChange$.subscribe(() => {
      this.loadStats();
    });
  }

  ngOnDestroy(): void {
    if (this.branchSub) {
      this.branchSub.unsubscribe();
    }
  }

  loadStats(): void {
    this.loading.set(true);
    let completedRequests = 0;
    const totalRequests = 4;

    const checkLoading = () => {
      completedRequests++;
      if (completedRequests >= totalRequests) {
        this.loading.set(false);
      }
    };

    this.dashboardService.getMemberCount().pipe(
      catchError(() => of(0)),
      finalize(() => checkLoading())
    ).subscribe(val => this.totalMembers.set(val));

    this.dashboardService.getActiveMemberCount().pipe(
      catchError(() => of(0)),
      finalize(() => checkLoading())
    ).subscribe(val => this.activeMembers.set(val));

    this.dashboardService.getTotalRevenue().pipe(
      catchError(() => of(0)),
      finalize(() => checkLoading())
    ).subscribe(val => this.totalRevenue.set(val));

    this.dashboardService.getTodayRevenue().pipe(
      catchError(() => of(0)),
      finalize(() => checkLoading())
    ).subscribe(val => this.todayRevenue.set(val));
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
