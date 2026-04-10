import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DietPlan, FoodItem, DietPlanTier } from '../models/diet-plan.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DietPlanService {
  private apiUrl = `${environment.apiUrl}/diet-plans`;

  constructor(private http: HttpClient) { }

  getDietPlanByMemberId(memberId: number): Observable<DietPlan> {
    return this.http.get<DietPlan>(`${this.apiUrl}/member/${memberId}`);
  }

  saveDietPlan(plan: DietPlan): Observable<DietPlan> {
    return this.http.post<DietPlan>(this.apiUrl, plan);
  }

  getFoodItems(): Observable<FoodItem[]> {
    return this.http.get<FoodItem[]>(`${this.apiUrl}/foods`);
  }

  // CORE LOGIC: BMR Calculation (Mifflin-St Jeor Equation)
  calculateBMR(weight: number, height: number, age: number, gender: string): number {
    if (gender === 'MALE') {
      return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
  }

  // CORE LOGIC: TDEE Calculation
  calculateTDEE(bmr: number, activityLevel: number): number {
    return bmr * activityLevel;
  }

  // CORE LOGIC: BMI Calculation
  calculateBMI(weight: number, height: number): number {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  }

  // CORE LOGIC: Macro Split
  // High Protein split: 40% Protein, 30% Carbs, 30% Fats
  calculateMacros(tdee: number) {
    return {
      protein: Math.round((tdee * 0.4) / 4), // 1g protein = 4 calories
      carbs: Math.round((tdee * 0.3) / 4),   // 1g carbs = 4 calories
      fats: Math.round((tdee * 0.3) / 9)     // 1g fats = 9 calories
    };
  }

  // Check eligibility for Diet Plan based on membership duration (months)
  getEligibleTier(months: number): DietPlanTier {
    if (months >= 3) return DietPlanTier.BASIC;
    return DietPlanTier.NONE;
  }
}
