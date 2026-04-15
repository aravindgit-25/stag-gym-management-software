import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MemberService } from '../../services/member.service';
import { DietPlanService } from '../../services/diet-plan.service';
import { SubscriptionService } from '../../services/subscription.service';
import { PlanService } from '../../services/plan.service';
import { NotificationService } from '../../services/notification.service';
import { Member } from '../../models/member.model';
import { Subscription } from '../../models/subscription.model';
import { Plan, PlanType } from '../../models/plan.model';
import { DietPlan, FoodItem, DietPlanTier, Meal } from '../../models/diet-plan.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';
import { AppStagTableComponent, StagTableColumn } from '../../shared/components/stag-table/stag-table';
import { AppModalComponent } from '../../shared/components/app-modal/app-modal';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-diet-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AppButtonComponent, AppStagTableComponent, AppModalComponent],
  templateUrl: './diet-plan.html',
  styleUrl: './diet-plan.css'
})
export class DietPlanComponent implements OnInit {
  loading = signal<boolean>(false);
  allMembers = signal<Member[]>([]);
  plans = signal<Plan[]>([]);
  subscriptions = signal<Subscription[]>([]);
  foodDatabase = signal<FoodItem[]>([]);
  selectedMember = signal<Member | null>(null);
  currentPlan = signal<DietPlan | null>(null);

  // Eligible members for diet plans
  members = computed(() => {
    return this.allMembers().filter(m => {
      const memberSubs = this.subscriptions().filter(s => Number(s.memberId || (s as any).member_id) === Number(m.id));
      if (memberSubs.length === 0) return false;

      // Check if member has ANY subscription to an ADD_ON plan with "diet" in the name
      const hasDietAddon = memberSubs.some(s => {
        const pId = s.planId || (s as any).plan_id;
        const plan = this.plans().find(p => Number(p.id) === Number(pId));
        return plan && plan.type === PlanType.ADD_ON && plan.name.toLowerCase().includes('diet');
      });

      if (hasDietAddon) return true;

      // If no specific addon, check membership duration (Must be >= 90 days / 3 months)
      const maxMembershipDuration = memberSubs
        .map(s => {
          const pId = s.planId || (s as any).plan_id;
          const plan = this.plans().find(p => Number(p.id) === Number(pId));
          return (plan && plan.type === PlanType.MEMBERSHIP) ? plan.duration : 0;
        })
        .reduce((max, d) => Math.max(max, d), 0);

      return maxMembershipDuration >= 90;
    });
  });
  
  showBuildModal = signal<boolean>(false);
  calcForm: FormGroup;
  
  columns: StagTableColumn[] = [
    { field: 'registrationId', header: 'Reg ID', width: '100px' },
    { field: 'name', header: 'Member Name', minWidth: '200px' },
    { field: 'tier', header: 'Tier', width: '120px', type: 'template' },
    { field: 'status', header: 'Status', width: '120px' },
    { field: 'actions', header: 'Action', width: '150px', type: 'template' }
  ];

  activityLevels = [
    { value: 1.2, label: 'Sedentary (Office job)' },
    { value: 1.375, label: 'Lightly Active (Gym 1-3 days)' },
    { value: 1.55, label: 'Moderately Active (Gym 3-5 days)' },
    { value: 1.725, label: 'Very Active (Hard Gym 6-7 days)' },
    { value: 1.9, label: 'Extra Active (Athlete/Physical work)' }
  ];

  constructor(
    private fb: FormBuilder,
    private memberService: MemberService,
    private dietService: DietPlanService,
    private subService: SubscriptionService,
    private planService: PlanService,
    private notif: NotificationService,
    private location: Location
  ) {
    this.calcForm = this.fb.group({
      weight: ['', [Validators.required, Validators.min(20)]],
      height: ['', [Validators.required, Validators.min(50)]],
      age: ['', [Validators.required, Validators.min(10)]],
      activityLevel: [1.2, Validators.required],
      tier: [DietPlanTier.BASIC]
    });

    this.calcForm.valueChanges.subscribe(() => this.recalculateStats());
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    forkJoin({
      members: this.memberService.getMembers().pipe(catchError(() => of([]))),
      plans: this.planService.getPlans().pipe(catchError(() => of([]))),
      subs: this.subService.getSubscriptions().pipe(catchError(() => of([]))),
      foods: this.dietService.getFoodItems().pipe(catchError(() => of([])))
    }).pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => {
        this.allMembers.set(res.members);
        this.plans.set(res.plans);
        this.subscriptions.set(res.subs);
        this.foodDatabase.set(res.foods);
      });
  }

  recalculateStats() {
    const { weight, height, age, activityLevel, tier } = this.calcForm.value;
    if (!weight || !height || !age) return;

    const bmr = this.dietService.calculateBMR(weight, height, age, this.selectedMember()?.gender || 'MALE');
    const tdee = this.dietService.calculateTDEE(bmr, activityLevel);
    const bmi = this.dietService.calculateBMI(weight, height);
    const macros = this.dietService.calculateMacros(tdee);

    this.currentPlan.update(prev => {
      if (!prev) return null;
      return {
        ...prev,
        tier, weight, height, age, activityLevel,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        bmi: parseFloat(bmi.toFixed(1)),
        targetCalories: Math.round(tdee),
        targetProtein: macros.protein,
        targetCarbs: macros.carbs,
        targetFats: macros.fats,
        monthlyUpdateLimit: tier === DietPlanTier.STANDARD ? 2 : 999
      };
    });
  }

  openBuilder(member: Member) {
    this.selectedMember.set(member);
    
    this.dietService.getDietPlanByMemberId(member.id!).subscribe({
      next: (existingPlan) => {
        if (existingPlan) {
          this.currentPlan.set(existingPlan);
          this.calcForm.patchValue({
            weight: existingPlan.weight,
            height: existingPlan.height,
            age: existingPlan.age,
            activityLevel: existingPlan.activityLevel,
            tier: existingPlan.tier
          }, { emitEvent: false });
        } else {
          this.createNewPlan(member);
        }
        this.showBuildModal.set(true);
      },
      error: () => {
        this.createNewPlan(member);
        this.showBuildModal.set(true);
      }
    });
  }

  createNewPlan(member: Member) {
    const initialPlan: DietPlan = {
      memberId: member.id!,
      registrationId: member.registrationId!,
      tier: DietPlanTier.BASIC,
      weight: 0, height: 0, age: 0, activityLevel: 1.2,
      bmr: 0, tdee: 0, bmi: 0,
      targetCalories: 0, targetProtein: 0, targetCarbs: 0, targetFats: 0,
      meals: [
        { time: 'Breakfast', foods: [], totalCalories: 0 },
        { time: 'Lunch', foods: [], totalCalories: 0 },
        { time: 'Evening Snack', foods: [], totalCalories: 0 },
        { time: 'Dinner', foods: [], totalCalories: 0 }
      ],
      status: 'PENDING',
      modificationCount: 0,
      monthlyUpdateLimit: 999
    };
    this.currentPlan.set(initialPlan);
    this.calcForm.reset({ weight: '', height: '', age: '', activityLevel: 1.2, tier: DietPlanTier.BASIC });
  }

  addFoodToMeal(meal: Meal, foodId: string) {
    const plan = this.currentPlan();
    const memberId = plan?.memberId || this.selectedMember()?.id;
    
    if (!memberId) {
      this.notif.show('No member selected.', 'error');
      return;
    }

    const food = this.foodDatabase().find(f => f.id === Number(foodId));
    if (food) {
      // Create request body as expected by the new backend endpoint
      const foodAssignment = {
        foodItemId: food.id, // Exact camelCase field name as requested
        mealTime: meal.time, // Breakfast, Lunch, etc.
        quantity: 1 // Default to 1
      };

      this.dietService.addFoodToMemberPlan(memberId, foodAssignment).subscribe({
        next: () => {
          meal.foods.push({ ...food });
          this.updatePlanTotals();
          this.notif.show(`${food.name} added to ${meal.time}`, 'success');
        },
        error: () => this.notif.show('Failed to add food item.', 'error')
      });
    }
  }

  removeFood(meal: Meal, index: number) {
    meal.foods.splice(index, 1);
    this.updatePlanTotals();
  }

  updatePlanTotals() {
    this.currentPlan.update(plan => {
      if (!plan) return null;
      
      let totalCals = 0, totalP = 0, totalC = 0, totalF = 0;
      
      plan.meals.forEach(m => {
        m.totalCalories = m.foods.reduce((sum, f) => sum + f.calories, 0);
        totalCals += m.totalCalories;
        totalP += m.foods.reduce((sum, f) => sum + f.protein, 0);
        totalC += m.foods.reduce((sum, f) => sum + f.carbs, 0);
        totalF += m.foods.reduce((sum, f) => sum + f.fats, 0);
      });

      return {
        ...plan,
        totalAssignedCalories: totalCals,
        totalAssignedProtein: totalP,
        totalAssignedCarbs: totalC,
        totalAssignedFats: totalF
      };
    });
  }

  canSave = computed(() => {
    const plan = this.currentPlan();
    if (!plan) return false;
    if (plan.tier === DietPlanTier.STANDARD && plan.modificationCount >= plan.monthlyUpdateLimit) {
      return false;
    }
    return true;
  });

  savePlan() {
    if (!this.canSave()) {
      this.notif.show('Monthly modification limit reached for Standard tier.', 'error');
      return;
    }

    this.dietService.saveDietPlan(this.currentPlan()!).subscribe({
      next: () => {
        this.notif.show('Diet Plan saved and tracking updated.', 'success');
        this.showBuildModal.set(false);
        this.loadData();
      },
      error: () => this.notif.show('Error saving diet plan.', 'error')
    });
  }

  getBMIStatus(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  getProgressWidth(actual: number = 0, target: number = 0): string {
    if (target === 0) return '0%';
    const percent = (actual / target) * 100;
    return Math.min(percent, 100) + '%';
  }

  goBack() { this.location.back(); }
}
