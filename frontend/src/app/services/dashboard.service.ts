import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private baseUrl = environment.apiUrl;

  private getBranchParams(): HttpParams {
    let params = new HttpParams();
    const branchId = this.auth.getBranchId();
    if (branchId) {
      params = params.set('branchId', branchId.toString());
    }
    return params;
  }

  getMemberCount(): Observable<number> {
    const params = this.getBranchParams();
    return this.http.get<number>(`${this.baseUrl}/members/count`, { params }).pipe(
      catchError(() => of(0))
    );
  }

  getActiveMemberCount(): Observable<number> {
    const params = this.getBranchParams();
    return this.http.get<number>(`${this.baseUrl}/members/active/count`, { params }).pipe(
      catchError(() => of(0))
    );
  }

  getTotalRevenue(): Observable<number> {
    const params = this.getBranchParams();
    return this.http.get<number>(`${this.baseUrl}/payments/total`, { params }).pipe(
      catchError(() => of(0))
    );
  }

  getTodayRevenue(): Observable<number> {
    const params = this.getBranchParams();
    return this.http.get<number>(`${this.baseUrl}/payments/today`, { params }).pipe(
      catchError(() => of(0))
    );
  }
}
