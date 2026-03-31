import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of } from 'rxjs';
import { Subscription } from '../models/subscription.model';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private apiUrl = `${environment.apiUrl}/subscriptions`;

  constructor(private http: HttpClient) { }

  /**
   * Supports multiple planIds by creating separate subscription records.
   * Ensures backend receives Numeric (Long) planId, not comma-separated string.
   */
  addSubscription(subscription: any): Observable<Subscription> {
    const rawPlanId = subscription.planId || subscription.plan_id;
    
    // Normalize planIds to an array of numbers
    let planIds: number[] = [];
    if (typeof rawPlanId === 'string' && rawPlanId.includes(',')) {
      planIds = rawPlanId.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
    } else if (Array.isArray(rawPlanId)) {
      planIds = rawPlanId.map(id => Number(id));
    } else {
      planIds = [Number(rawPlanId)];
    }

    // Filter out zeros/NaNs
    planIds = planIds.filter(id => id > 0);

    if (planIds.length === 0) {
      return of({} as Subscription); // Should be caught by component validation
    }

    if (planIds.length === 1) {
      const finalSub = { 
        ...subscription, 
        planId: planIds[0],
        plan_id: planIds[0] 
      };
      return this.http.post<Subscription>(this.apiUrl, finalSub);
    }

    // For multiple plans, create a request for each
    const requests = planIds.map(id => {
      const singleSub = { 
        ...subscription, 
        planId: id,
        plan_id: id 
      };
      return this.http.post<Subscription>(this.apiUrl, singleSub);
    });

    return forkJoin(requests).pipe(
      map(results => results[0]) // Return the first one to satisfy component expected signature
    );
  }

  getSubscriptions(): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(this.apiUrl);
  }
}
