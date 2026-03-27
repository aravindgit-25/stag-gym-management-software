import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) { }

  getMemberCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/members/count`);
  }

  getActiveMemberCount(): Observable<number> {
    // Assuming /members/active/count based on your request
    return this.http.get<number>(`${this.baseUrl}/members/active/count`);
  }

  getTotalRevenue(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/payments/total`);
  }

  getTodayRevenue(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/payments/today`);
  }
}
