import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Lead } from '../models/lead.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private apiUrl = `${environment.apiUrl}/leads`;

  constructor(private http: HttpClient) { }

  getLeads(): Observable<Lead[]> {
    return this.http.get<Lead[]>(this.apiUrl);
  }

  addLead(lead: Lead): Observable<Lead> {
    return this.http.post<Lead>(this.apiUrl, lead);
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
