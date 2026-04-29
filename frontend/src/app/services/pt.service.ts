import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PTMember, PTSessionLog } from '../models/pt.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PTService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/personal-training`;

  private getBranchParams(): HttpParams {
    let params = new HttpParams();
    const branchId = this.auth.getBranchId();
    if (branchId) {
      params = params.set('branchId', branchId.toString());
    }
    return params;
  }

  getActivePTMembers(): Observable<PTMember[]> {
    const params = this.getBranchParams();
    return this.http.get<any[]>(`${this.apiUrl}/active-participants`, { params }).pipe(
      map(data => data.map(item => this.mapToPTMember(item)))
    );
  }

  private mapToPTMember(item: any): PTMember {
    return {
      id: item.id || item.pt_subscription_id,
      memberId: item.memberId || item.member_id,
      memberName: item.memberName || item.member_name,
      memberPhone: item.memberPhone || item.member_phone,
      trainerId: item.trainerId || item.trainer_id,
      trainerName: item.trainerName || item.trainer_name,
      planId: item.planId || item.plan_id,
      planName: item.planName || item.plan_name,
      totalSessions: item.totalSessions || item.total_sessions,
      sessionsRemaining: item.sessionsRemaining !== undefined ? item.sessionsRemaining : item.sessions_remaining,
      expiryDate: item.expiryDate || item.expiry_date,
      startDate: item.startDate || item.start_date,
      status: item.status || 'ACTIVE'
    };
  }

  logSession(log: PTSessionLog): Observable<PTSessionLog> {
    return this.http.post<PTSessionLog>(`${this.apiUrl}/log-session`, log);
  }

  getSessionHistory(ptMemberId: number): Observable<PTSessionLog[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history/${ptMemberId}`).pipe(
      map(data => data.map(item => ({
        id: item.id,
        ptMemberId: item.ptMemberId || item.pt_member_id,
        date: item.date,
        trainerId: item.trainerId || item.trainer_id,
        trainerName: item.trainerName || item.trainer_name,
        trainerVerification: item.trainerVerification !== undefined ? item.trainerVerification : item.trainer_verification,
        clientVerification: item.clientVerification !== undefined ? item.clientVerification : item.client_verification,
        notes: item.notes,
        sessionsRemainingAfter: item.sessionsRemainingAfter !== undefined ? item.sessionsRemainingAfter : item.sessions_remaining_after
      })))
    );
  }

  subscribeMember(subscriptionData: any): Observable<PTMember> {
    const params = this.getBranchParams();
    return this.http.post<PTMember>(`${this.apiUrl}/subscribe`, subscriptionData, { params });
  }

  processPTPayment(paymentData: any): Observable<any> {
    // Requirements: Send ptSubscriptionId instead of subscriptionId for PT payments
    const payload = {
      ...paymentData,
      ptSubscriptionId: paymentData.ptSubscriptionId
    };
    // The requirement states payments are sent to /api/v1/payments
    return this.http.post<any>(`${environment.apiUrl}/payments`, payload);
  }
}
