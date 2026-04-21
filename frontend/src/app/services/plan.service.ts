import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { Plan, PlanType } from '../models/plan.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/plans`;

  private getBranchParams(): HttpParams {
    let params = new HttpParams();
    const branchId = this.auth.getBranchId();
    if (branchId) {
      params = params.set('branchId', branchId.toString());
    }
    return params;
  }

  getPlans(): Observable<Plan[]> {
    return this.http.get<any[]>(this.apiUrl, { params: this.getBranchParams() }).pipe(
      map(plans => plans.map(p => ({
        ...p,
        type: p.type || p.planType || p.plan_type || PlanType.MEMBERSHIP
      }))),
      catchError(() => of([]))
    );
  }

  addPlan(plan: Plan): Observable<Plan> {
    const bId = this.auth.getBranchId();
    const data = { 
      ...plan, 
      planType: plan.type, 
      plan_type: plan.type,
      branchId: bId || (plan as any).branchId 
    };
    return this.http.post<Plan>(this.apiUrl, data, { params: this.getBranchParams() });
  }

  updatePlan(id: number, plan: Plan): Observable<Plan> {
    return this.http.put<Plan>(`${this.apiUrl}/${id}`, plan);
  }

  deletePlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
