import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Salary, AttendanceSummary, SalaryStatus } from '../models/salary.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SalaryService {
  private apiUrl = `${environment.apiUrl}/salary`;

  constructor(private http: HttpClient) { }

  getMonthlyAttendanceSummary(employeeId: number, month: number, year: number): Observable<AttendanceSummary> {
    return this.http.get<AttendanceSummary>(`${this.apiUrl}/attendance-summary/${employeeId}`, {
      params: { month, year }
    });
  }

  calculateSalary(employeeId: number, month: number, year: number): Observable<Salary> {
    return this.http.post<Salary>(`${this.apiUrl}/calculate/${employeeId}`, {}, {
      params: { month, year }
    });
  }

  paySalary(salaryId: number, paymentMethod: string): Observable<Salary> {
    return this.http.put<Salary>(`${this.apiUrl}/${salaryId}/pay`, { paymentMethod });
  }

  getSalariesByMonth(monthYear: string): Observable<Salary[]> {
    return this.http.get<Salary[]>(`${this.apiUrl}/month/${monthYear}`);
  }

  getEmployeeSalaryHistory(employeeId: number): Observable<Salary[]> {
    return this.http.get<Salary[]>(`${this.apiUrl}/employee/${employeeId}`);
  }
}
