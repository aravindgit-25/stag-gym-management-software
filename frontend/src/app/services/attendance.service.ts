import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Attendance, AttendanceStatus } from '../models/attendance.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  // Removed trailing slash to match standard REST patterns and working services
  private apiUrl = `${environment.apiUrl}/attendance`;

  private getBranchParams(): HttpParams {
    let params = new HttpParams();
    const branchId = this.auth.getBranchId();
    if (branchId) {
      params = params.set('branchId', branchId.toString());
    }
    return params;
  }

  getAttendanceByDate(date: string): Observable<Attendance[]> {
    const params = this.getBranchParams().set('date', date);
    return this.http.get<Attendance[]>(this.apiUrl, { params }).pipe(
      catchError(() => of([]))
    );
  }

  getDailyAttendance(date: string): Observable<Attendance[]> {
    return this.getAttendanceByDate(date);
  }

  markAttendance(attendance: Attendance): Observable<Attendance> {
    const bId = this.auth.getBranchId();
    const params = this.getBranchParams(); 
    const payload = { 
      ...attendance, 
      branchId: bId || (attendance as any).branchId 
    };
    return this.http.post<Attendance>(this.apiUrl, payload, { params });
  }

  getMonthlyAttendance(employeeId: number, month: number, year: number): Observable<Attendance[]> {
    const params = this.getBranchParams()
      .set('employeeId', employeeId.toString())
      .set('month', month.toString())
      .set('year', year.toString());
    return this.http.get<Attendance[]>(`${this.apiUrl}/monthly`, { params }).pipe(
      catchError(() => of([]))
    );
  }

  checkoutAttendance(employeeCode: string): Observable<Attendance> {
    const params = this.getBranchParams().set('employeeCode', employeeCode);
    return this.http.post<Attendance>(`${this.apiUrl}/checkout`, {}, { params });
  }

  getEmployeeAttendanceHistory(employeeId: any, month: number, year: number): Observable<Attendance[]> {
    return this.getMonthlyAttendance(Number(employeeId), month, year);
  }
}
