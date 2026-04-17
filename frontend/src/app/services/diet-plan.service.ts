import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DietPlan, FoodItem, DietPlanTier } from '../models/diet-plan.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DietPlanService {
  private apiUrl = `${environment.apiUrl}/diet-plans`;

  constructor(private http: HttpClient) { }

  private mapDietPlan(plan: any): DietPlan {
    if (!plan) return plan;
    
    // Ensure tier is set
    const mappedPlan: DietPlan = {
      ...plan,
      tier: plan.type || plan.tier || DietPlanTier.STANDARD
    };

    // Try to find assignments in common fields, including 'details' seen in debug log
    const assignments = plan.foodAssignments || plan.assignments || plan.planItems || plan.diet_items || plan.details || [];
    
    // If we have assignments, group them into meals
    if (assignments.length > 0) {
      const mealTimes = ['Breakfast', 'Lunch', 'Evening Snack', 'Dinner'];
      mappedPlan.meals = mealTimes.map(time => {
        const mealAssignments = assignments.filter((a: any) => 
          (a.mealTime || a.meal_time || a.type)?.toLowerCase() === time.toLowerCase()
        );
        
        const foods = mealAssignments.map((a: any) => {
          // Food might be nested in foodItem, food_item, or flat in the assignment
          const food = a.foodItem || a.food_item || a.foodItemDetails || (a.name ? a : null);
          if (!food) return null;

          return {
            id: food.id,
            name: food.name,
            calories: Number(food.calories || a.calories || 0),
            protein: Number(food.protein || a.protein || 0),
            carbs: Number(food.carbs || a.carbs || 0),
            fats: Number(food.fats || a.fats || 0),
            unit: food.unit || a.unit || ''
          };
        }).filter((f: any) => f !== null);

        return {
          time,
          foods,
          totalCalories: foods.reduce((sum: number, f: any) => sum + f.calories, 0)
        };
      });
    } else if (plan.meals && plan.meals.length > 0) {
      // If meals already exist but might have different internal structure
      mappedPlan.meals = plan.meals.map((m: any) => {
        const foods = (m.foods || m.items || m.assignments || []).map((f: any) => ({
          id: f.id,
          name: f.name || (f.foodItem?.name),
          calories: Number(f.calories || f.foodItem?.calories || 0),
          protein: Number(f.protein || f.foodItem?.protein || 0),
          carbs: Number(f.carbs || f.foodItem?.carbs || 0),
          fats: Number(f.fats || f.foodItem?.fats || 0),
          unit: f.unit || f.foodItem?.unit || ''
        }));

        return {
          time: m.time || m.mealTime || m.meal_time,
          foods: foods,
          totalCalories: m.totalCalories || foods.reduce((sum: number, f: any) => sum + f.calories, 0)
        };
      });
    }

    // If still no meals, provide empty structure
    if (!mappedPlan.meals || mappedPlan.meals.length === 0) {
      mappedPlan.meals = [
        { time: 'Breakfast', foods: [], totalCalories: 0 },
        { time: 'Lunch', foods: [], totalCalories: 0 },
        { time: 'Evening Snack', foods: [], totalCalories: 0 },
        { time: 'Dinner', foods: [], totalCalories: 0 }
      ];
    }

    return mappedPlan;
  }

  getDietPlanByMemberId(member_id: number): Observable<DietPlan> {
    return this.http.get<any>(`${this.apiUrl}/member/${member_id}`).pipe(
      map(plan => this.mapDietPlan(plan))
    );
  }

  getDietPlans(): Observable<DietPlan[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(plans => plans.map(plan => this.mapDietPlan(plan)))
    );
  }

  saveDietPlan(plan: DietPlan): Observable<DietPlan> {
    const payload = {
      ...plan,
      type: plan.tier || 'STANDARD',
      category: (plan as any).category || 'VEG',
      plan_type: plan.tier || 'STANDARD', // Backup for snake_case
      planType: plan.tier || 'STANDARD'   // Backup for camelCase
    };
    return this.http.post<DietPlan>(this.apiUrl, payload);
  }

  getFoodItems(): Observable<FoodItem[]> {
    return this.http.get<FoodItem[]>(`${environment.apiUrl}/food-items`);
  }

  addFoodToMemberPlan(memberId: number, foodData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/member/${memberId}/food`, foodData);
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
