import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Salary, AttendanceSummary, SalaryStatus } from '../models/salary.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SalaryService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/salaries`;

  private getBranchParams(): HttpParams {
    let params = new HttpParams();
    const branchId = this.auth.getBranchId();
    if (branchId) {
      params = params.set('branchId', branchId.toString());
    }
    return params;
  }

  getSalaries(): Observable<Salary[]> {
    return this.http.get<Salary[]>(this.apiUrl, { params: this.getBranchParams() }).pipe(
      catchError(() => of([]))
    );
  }

  getSalariesByMonth(monthYear: string): Observable<Salary[]> {
    const params = this.getBranchParams().set('monthYear', monthYear);
    return this.http.get<Salary[]>(`${this.apiUrl}/month`, { params }).pipe(
      catchError(() => of([]))
    );
  }

  calculateSalary(employeeId: number, month: number, year: number): Observable<Salary> {
    const params = this.getBranchParams()
      .set('employeeId', employeeId.toString())
      .set('month', month.toString())
      .set('year', year.toString());
    return this.http.post<Salary>(`${this.apiUrl}/calculate`, {}, { params });
  }

  paySalary(id: number, paymentMethod: string): Observable<Salary> {
    const params = new HttpParams().set('paymentMethod', paymentMethod);
    return this.http.post<Salary>(`${this.apiUrl}/${id}/pay`, {}, { params });
  }

  getEmployeeSalaryHistory(employeeId: number): Observable<Salary[]> {
    return this.http.get<Salary[]>(`${this.apiUrl}/employee/${employeeId}`, { params: this.getBranchParams() }).pipe(
      catchError(() => of([]))
    );
  }
}
