import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { User, AuthResponse, UserRole } from '../models/user.model';
import { environment } from '../../environments/environment';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  currentUser = signal<User | null>(null);
  selectedBranchId = signal<number | null>(null);

  // Optimized Computed Signals for UI performance
  isLoggedIn = computed(() => this.currentUser() !== null && !!this.getToken());
  
  isOwner = computed(() => {
    const user = this.currentUser();
    return user?.role === UserRole.OWNER || (user?.role as any) === 'ADMIN';
  });

  isTrainer = computed(() => {
    const user = this.currentUser();
    return user?.role === UserRole.TRAINER || (user?.role as any) === 'STAFF';
  });

  constructor() {
    this.initAuth();
  }

  private initAuth() {
    try {
      const savedUser = localStorage.getItem('gym_user');
      const savedToken = localStorage.getItem('gym_token');
      const savedBranch = localStorage.getItem('gym_selected_branch');

      if (savedUser && savedToken && savedUser !== 'undefined') {
        const user = JSON.parse(savedUser);
        this.currentUser.set(user);
        
        // For trainers, always use their assigned branch
        if (user.role === UserRole.TRAINER || (user.role as any) === 'STAFF') {
          this.selectedBranchId.set(user.branchId || null);
        } else if (savedBranch) {
          this.selectedBranchId.set(Number(savedBranch));
        } else if (user.branchId) {
          // Fallback for owners to their primary branch
          this.selectedBranchId.set(user.branchId);
        }
      }
    } catch (e) {
      console.error('Error initializing AuthService:', e);
      this.logout();
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const payload = { email, username: email, emailid: email, emailId: email, password };
    const headers = { 'Content-Type': 'application/json' };
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload, { headers }).pipe(
      tap(res => {
        if (!res || !res.token) throw new Error('Invalid response');

        const user: User = {
          id: res.id,
          name: res.name,
          username: res.username || res.email,
          email: res.email,
          role: res.role,
          branchId: res.branchId
        };

        localStorage.setItem('gym_token', res.token);
        localStorage.setItem('gym_user', JSON.stringify(user));
        this.currentUser.set(user);
        
        // Immediate branch selection based on login response
        this.selectedBranchId.set(user.branchId || null);
        if (user.branchId) {
          localStorage.setItem('gym_selected_branch', user.branchId.toString());
        }
      })
    );
  }

  logout() {
    localStorage.clear();
    this.currentUser.set(null);
    this.selectedBranchId.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    const token = localStorage.getItem('gym_token');
    if (!token || token === 'undefined' || token === 'null') return null;
    return token;
  }

  setBranch(branchId: number | null) {
    if (this.isOwner()) {
      this.selectedBranchId.set(branchId);
      if (branchId) localStorage.setItem('gym_selected_branch', branchId.toString());
      else localStorage.removeItem('gym_selected_branch');
    }
  }

  getBranchId(): number | null {
    // If Owner has specifically selected a branch, use it. 
    // If they selected 'All Branches' (null), return null.
    if (this.isOwner()) {
      return this.selectedBranchId();
    }
    // For Trainers, always return their assigned branchId
    return this.currentUser()?.branchId || null;
  }
}
