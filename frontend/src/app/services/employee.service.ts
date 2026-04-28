import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Employee } from '../models/employee.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/employees`;

  private getBranchParams(): HttpParams {
    let params = new HttpParams();
    const branchId = this.auth.getBranchId();
    if (branchId) {
      params = params.set('branchId', branchId.toString());
    }
    return params;
  }

  getEmployees(): Observable<any[]> {
    const params = this.getBranchParams();
    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      catchError(() => of([]))
    );
  }

  getActiveEmployees(): Observable<Employee[]> {
    const params = this.getBranchParams();
    return this.http.get<Employee[]>(`${this.apiUrl}/active`, { params }).pipe(
      catchError(() => of([]))
    );
  }

  addEmployee(employee: Employee): Observable<Employee> {
    // Priority: 1. Branch selected in the form, 2. Current active branch selection, 3. Null (Backend default)
    const payload = { 
      ...employee, 
      branchId: employee.branchId || this.auth.getBranchId() 
    };
    return this.http.post<Employee>(this.apiUrl, payload);
  }

  updateEmployee(id: number, employee: Employee): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${id}`, employee);
  }

  getEmployeeProfile(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}/profile`);
  }

  terminateEmployee(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/terminate`, {});
  }

  assignPTMember(employeeId: number, ptData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${employeeId}/pt`, ptData);
  }

  addFeedback(employeeId: number, feedbackData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${employeeId}/feedback`, feedbackData);
  }
}
