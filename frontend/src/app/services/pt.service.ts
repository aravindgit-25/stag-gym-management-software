import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
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
    return this.http.get<any>(`${this.apiUrl}/active-participants`, { params }).pipe(
      map(res => {
        // Handle both direct array and wrapped object responses
        const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
        if (!Array.isArray(data)) return [];
        return data.map(item => this.mapToPTMember(item));
      }),
      catchError(err => {
        console.error('Error fetching PT members:', err);
        return of([]);
      })
    );
  }

  private mapToPTMember(item: any): PTMember {
    if (!item) return {} as PTMember;
    
    // Normalize IDs and Names from various possible backend naming conventions
    const id = item.id || item.pt_subscription_id || item.ptSubscriptionId || item.subscriptionId;
    const memberId = item.memberId || item.member_id;
    const memberName = item.memberName || item.member_name || item.name || item.Member?.name || 'Unknown Member';
    const trainerId = item.trainerId || item.trainer_id || item.staffId || item.staff_id;
    const trainerName = item.trainerName || item.trainer_name || item.Trainer?.name || item.Staff?.name || 'Unassigned';
    
    return {
      id: Number(id),
      memberId: Number(memberId),
      memberName,
      memberPhone: item.memberPhone || item.member_phone || item.Member?.phone || '',
      trainerId: trainerId ? Number(trainerId) : 0,
      trainerName,
      planId: item.planId || item.plan_id || 0,
      planName: item.planName || item.plan_name || item.Plan?.name || 'N/A',
      totalSessions: item.totalSessions || item.total_sessions || 0,
      sessionsRemaining: item.sessionsRemaining !== undefined ? item.sessionsRemaining : (item.sessions_remaining !== undefined ? item.sessions_remaining : 0),
      expiryDate: item.expiryDate || item.expiry_date || '',
      startDate: item.startDate || item.start_date || '',
      status: item.status || 'ACTIVE'
    };
  }

  logSession(log: PTSessionLog): Observable<PTSessionLog> {
    return this.http.post<PTSessionLog>(`${this.apiUrl}/log-session`, log);
  }

  getSessionHistory(ptMemberId: number): Observable<PTSessionLog[]> {
    const branchId = this.auth.getBranchId();
    const url = branchId 
      ? `${this.apiUrl}/history/${ptMemberId}?branchId=${branchId}`
      : `${this.apiUrl}/history/${ptMemberId}`;

    return this.http.get<any>(url).pipe(
      map(res => {
        const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
        if (!Array.isArray(data)) return [];
        
        return data.map(item => ({
          id: item.id || item.pt_session_log_id,
          ptMemberId: item.ptMemberId || item.pt_member_id || item.ptSubscriptionId,
          date: item.date || item.session_date || item.createdAt?.split('T')[0] || '',
          trainerId: item.trainerId || item.trainer_id || item.staffId,
          trainerName: item.trainerName || item.trainer_name || item.Trainer?.name || item.Staff?.name || 'Assigned Trainer',
          trainerVerification: item.trainerVerification !== undefined ? item.trainerVerification : (item.trainer_verification !== undefined ? item.trainer_verification : true),
          clientVerification: item.clientVerification !== undefined ? item.clientVerification : (item.client_verification !== undefined ? item.client_verification : false),
          notes: item.notes || item.comment || '',
          sessionsRemainingAfter: item.sessionsRemainingAfter !== undefined ? item.sessionsRemainingAfter : (item.sessions_remaining_after !== undefined ? item.sessions_remaining_after : (item.remaining_sessions !== undefined ? item.remaining_sessions : 0))
        }));
      }),
      catchError(err => {
        console.error('Error fetching PT history:', err);
        return of([]);
      })
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

  updatePTTrainer(ptSubscriptionId: number, trainerId: number): Observable<any> {
    const payload = {
      trainerId,
      branchId: this.auth.getBranchId()
    };
    return this.http.post(`${this.apiUrl}/${ptSubscriptionId}/trainer`, payload);
  }
}
