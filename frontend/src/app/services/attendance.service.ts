import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Attendance, AttendanceStatus } from '../models/attendance.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient) { }

  markAttendance(employeeId: string, status: AttendanceStatus, notes?: string): Observable<Attendance> {
    let params = new HttpParams().set('status', status);
    if (notes) params = params.set('notes', notes);
    return this.http.post<Attendance>(`${this.apiUrl}/${employeeId}/mark`, {}, { params });
  }

  checkoutAttendance(employeeId: string): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.apiUrl}/${employeeId}/checkout`, {});
  }

  getDailyAttendance(date: string): Observable<Attendance[]> {
    return this.http.get<Attendance[]>(`${this.apiUrl}/daily`, {
      params: { date }
    });
  }

  getEmployeeAttendanceHistory(employeeId: string, month: number, year: number): Observable<Attendance[]> {
    const start = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
    
    return this.http.get<Attendance[]>(`${this.apiUrl}/employee/${employeeId}`, {
      params: { start, end }
    });
  }
}
