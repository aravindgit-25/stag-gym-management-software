import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Lead } from '../models/lead.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/leads`;

  private getBranchParams(): HttpParams {
    let params = new HttpParams();
    const branchId = this.auth.getBranchId();
    if (branchId) {
      params = params.set('branchId', branchId.toString());
    }
    return params;
  }

  getLeads(): Observable<Lead[]> {
    return this.http.get<Lead[]>(this.apiUrl, { params: this.getBranchParams() }).pipe(
      catchError(() => of([]))
    );
  }

  addLead(lead: Lead): Observable<Lead> {
    const branchId = this.auth.getBranchId();
    const payload = { ...lead, branchId: branchId || (lead as any).branchId };
    return this.http.post<Lead>(this.apiUrl, payload);
  }

  updateLead(id: number, lead: Lead): Observable<Lead> {
    return this.http.put<Lead>(`${this.apiUrl}/${id}`, lead);
  }

  addFollowUp(id: number, notes: string, nextFollowUpDate: string, status?: string): Observable<Lead> {
    let params: any = { notes, nextFollowUpDate };
    if (status) params.status = status;
    return this.http.post<Lead>(`${this.apiUrl}/${id}/follow-up`, {}, { params });
  }

  convertLead(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/convert`, {});
  }

  deleteLead(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
