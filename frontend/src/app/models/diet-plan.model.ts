import { Member } from './member.model';

export enum DietPlanTier {
  NONE = 'NONE',
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM'
}

export interface FoodItem {
  id?: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  image?: string;
  benefits?: string;
  unit: string; // e.g., "100g", "1 piece"
}

export interface Meal {
  time: string; // e.g., "Breakfast", "Lunch"
  foods: FoodItem[];
  totalCalories: number;
}

export interface DietPlan {
  id?: number;
  memberId: number;
  registrationId: string;
  tier: DietPlanTier;
  
  // Stats for Calculation
  weight: number;
  height: number;
  age: number;
  activityLevel: number; // 1.2 to 1.9
  bmr: number;
  tdee: number;
  bmi: number;
  
  // Macros
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  
  meals: Meal[];
  status: 'PENDING' | 'GENERATED' | 'MODIFIED';
  lastModified?: string;
  modificationCount: number;
  monthlyUpdateLimit: number; // e.g., 2 for Standard
  totalAssignedCalories?: number;
  totalAssignedProtein?: number;
  totalAssignedCarbs?: number;
  totalAssignedFats?: number;
}
