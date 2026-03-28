import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Member } from '../models/member.model';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  private apiUrl = `${environment.apiUrl}/members`;

  constructor(private http: HttpClient) { }

  getMembers(): Observable<Member[]> {
    return this.http.get<Member[]>(this.apiUrl);
  }

  addMember(member: Member): Observable<Member> {
    return this.http.post<Member>(this.apiUrl, member);
  }

  updateMember(id: number, member: Member): Observable<Member> {
    return this.http.put<Member>(`${this.apiUrl}/${id}`, member);
  }

  deleteMember(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getActiveMembers(): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.apiUrl}/active`);
  }

  generateRegistrationId(): Observable<string> {
    return this.http.get(`${this.apiUrl}/registration-id`, { 
      responseType: 'text' 
    });
  }
}
