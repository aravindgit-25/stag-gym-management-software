import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Member } from '../models/member.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/members`;

  private getBranchParams(): HttpParams {
    let params = new HttpParams();
    const branchId = this.auth.getBranchId();
    if (branchId) {
      params = params.set('branchId', branchId.toString());
    }
    return params;
  }

  getMembers(): Observable<Member[]> {
    return this.http.get<Member[]>(this.apiUrl, { params: this.getBranchParams() });
  }

  addMember(member: Member): Observable<Member> {
    const bId = this.auth.getBranchId();
    const params = this.getBranchParams(); 
    const payload = { 
      ...member, 
      branchId: bId || member.branchId 
    };
    return this.http.post<Member>(this.apiUrl, payload, { params });
  }

  updateMember(id: number, member: Member): Observable<Member> {
    return this.http.put<Member>(`${this.apiUrl}/${id}`, member);
  }

  deleteMember(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getActiveMembers(): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.apiUrl}/active`, { params: this.getBranchParams() });
  }

  generateRegistrationId(): Observable<string> {
    return this.http.get(`${this.apiUrl}/registration-id`, { 
      responseType: 'text' 
    });
  }
}
