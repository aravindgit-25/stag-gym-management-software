import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Plan, PlanType } from '../models/plan.model';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  private apiUrl = `${environment.apiUrl}/plans`;

  constructor(private http: HttpClient) { }

  getPlans(): Observable<Plan[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(plans => plans.map(p => ({
        ...p,
        type: p.type || p.planType || p.plan_type || PlanType.MEMBERSHIP
      })))
    );
  }

  addPlan(plan: Plan): Observable<Plan> {
    const data = { ...plan, planType: plan.type, plan_type: plan.type };
    return this.http.post<Plan>(this.apiUrl, data);
  }

  updatePlan(id: number, plan: Plan): Observable<Plan> {
    const data = { ...plan, planType: plan.type, plan_type: plan.type };
    return this.http.put<Plan>(`${this.apiUrl}/${id}`, data);
  }

  deletePlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
