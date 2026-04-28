import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, of, catchError } from 'rxjs';
import { Subscription } from '../models/subscription.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/subscriptions`;

  private getBranchParams(): HttpParams {
    let params = new HttpParams();
    const branchId = this.auth.getBranchId();
    if (branchId) {
      params = params.set('branchId', branchId.toString());
    }
    return params;
  }

  addSubscription(subscription: any): Observable<Subscription> {
    const bId = this.auth.getBranchId();
    const params = this.getBranchParams();
    const rawPlanId = subscription.planId || subscription.plan_id;
    
    let planIds: number[] = [];
    if (typeof rawPlanId === 'string' && rawPlanId.includes(',')) {
      planIds = rawPlanId.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
    } else if (Array.isArray(rawPlanId)) {
      planIds = rawPlanId.map(id => Number(id));
    } else {
      planIds = [Number(rawPlanId)];
    }

    planIds = planIds.filter(id => id > 0);

    if (planIds.length === 0) return of({} as Subscription);

    if (planIds.length === 1) {
      const finalSub = { 
        ...subscription, 
        planId: planIds[0],
        branchId: bId || subscription.branchId 
      };
      return this.http.post<Subscription>(this.apiUrl, finalSub, { params });
    }

    const requests = planIds.map(id => {
      const singleSub = { 
        ...subscription, 
        planId: id,
        branchId: bId || subscription.branchId 
      };
      return this.http.post<Subscription>(this.apiUrl, singleSub, { params });
    });

    return forkJoin(requests).pipe(map(results => results[0]));
  }

  getSubscriptions(): Observable<Subscription[]> {
    const params = this.getBranchParams();
    return this.http.get<Subscription[]>(this.apiUrl, { params }).pipe(
      catchError(() => of([]))
    );
  }
}
