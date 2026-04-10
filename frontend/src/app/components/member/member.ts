import { Component, OnInit, signal, computed, inject, Pipe, PipeTransform } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { MemberService } from '../../services/member.service';
import { SubscriptionService } from '../../services/subscription.service';
import { PlanService } from '../../services/plan.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';
import { PaymentService } from '../../services/payment.service';
import { Member, Gender, MemberStatus } from '../../models/member.model';
import { Subscription } from '../../models/subscription.model';
import { Plan, PlanType } from '../../models/plan.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';
import {
  AppStagTableComponent,
  StagTableColumn,
} from '../../shared/components/stag-table/stag-table';
import { AppModalComponent } from '../../shared/components/app-modal/app-modal';

@Pipe({
  name: 'filterByStatus',
  standalone: true
})
export class FilterByStatusPipe implements PipeTransform {
  transform(members: any[], status: string): any[] {
    if (!members) return [];
    const today = new Date();
    today.setHours(0,0,0,0);

    switch(status) {
      case 'ACTIVE': 
        return members.filter(m => !m.isExpired);
      case 'INACTIVE':
        return members.filter(m => m.isExpired);
      case 'EXPIRING':
        return members.filter(m => m.isExpiringSoon);
      default:
        return members;
    }
  }
}

@Component({
  selector: 'app-member',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AppButtonComponent,
    AppStagTableComponent,
    AppModalComponent,
    FilterByStatusPipe
  ],
  templateUrl: './member.html',
  styleUrl: './member.css',
})
export class MemberComponent implements OnInit {
  memberForm: FormGroup;
  subscriptionForm: FormGroup;
  paymentForm: FormGroup;
  
  // Add-on feature properties
  addonForm: FormGroup;
  showAddonModal = signal<boolean>(false);
  availableAddons = computed(() => this.plans().filter(p => p.type === PlanType.ADD_ON));

  members = signal<Member[]>([]);
  plans = signal<Plan[]>([]);
  subscriptions = signal<Subscription[]>([]);
  
  selectedPlanIds = signal<number[]>([]);
  selectedFilter = signal<string>('all');
  selectedPlanFilter = signal<number | null>(null);
  selectedMonthFilter = signal<string | null>(null);
  searchTerm = signal<string>('');
  
  loading = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);
  showModal = signal<boolean>(false);
  currentStep = signal<number>(1);
  
  createdMemberId = signal<number | null>(null);
  paymentModes = ['Cash', 'UPI', 'Card', 'Bank Transfer'];
  tableHeight = signal<string>('calc(100vh - 350px)');

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private notif = inject(NotificationService);
  private confirm = inject(ConfirmService);
  private memberService = inject(MemberService);
  private subscriptionService = inject(SubscriptionService);
  private paymentService = inject(PaymentService);
  private planService = inject(PlanService);
  private fb = inject(FormBuilder);

  tableColumns = signal<StagTableColumn[]>([
    { field: 'registrationId', header: 'Reg ID', width: '100px' },
    { field: 'name', header: 'Full Name', minWidth: '200px' },
    { field: 'phone', header: 'Phone', width: '130px' },
    { field: 'expiryDisplay', header: 'Expiry', width: '130px', type: 'template' },
    { field: 'actions', header: 'Services', width: '150px', type: 'template' }
  ]);

  constructor() {
    this.memberForm = this.fb.group({
      registrationId: [''],
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      gender: [Gender.MALE, Validators.required],
      dob: [''],
      address: [''],
      bloodGroup: [''],
      weight: [null],
      height: [null],
      fitnessGoal: [''],
      emergencyContactName: [''],
      emergencyContactPhone: [''],
      joiningDate: [new Date().toISOString().split('T')[0], Validators.required],
      status: [MemberStatus.ACTIVE]
    });

    this.subscriptionForm = this.fb.group({
      startDate: [new Date().toISOString().split('T')[0], Validators.required],
    });

    this.paymentForm = this.fb.group({
      amount: [0],
      paidAmount: [0, [Validators.required, Validators.min(0)]],
      balanceAmount: [0],
      balanceDueDate: [''],
      paymentMode: ['Cash', Validators.required],
    });

    this.addonForm = this.fb.group({
      planId: ['', Validators.required],
      paidAmount: [0, [Validators.required, Validators.min(0)]],
      paymentMode: ['Cash', Validators.required]
    });

    this.paymentForm.get('paidAmount')?.valueChanges.subscribe(paid => {
      const total = this.paymentForm.get('amount')?.value || 0;
      const balance = total - (paid || 0);
      this.paymentForm.get('balanceAmount')?.setValue(balance, { emitEvent: false });
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.route.queryParams.subscribe(params => {
      if (params['filter']) this.selectedFilter.set(params['filter']);
      if (params['action'] === 'add') this.openAddModal();
    });
  }

  loadData(): void {
    this.loading.set(true);
    forkJoin({
      members: this.memberService.getMembers().pipe(catchError(() => of([]))),
      plans: this.planService.getPlans().pipe(catchError(() => of([]))),
      subscriptions: this.subscriptionService.getSubscriptions().pipe(catchError(() => of([]))),
    }).pipe(finalize(() => this.loading.set(false)))
      .subscribe((res) => {
        this.members.set(res.members);
        this.plans.set(res.plans);
        this.subscriptions.set(res.subscriptions);
      });
  }

  openAddModal() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.currentStep.set(1);
    this.selectedPlanIds.set([]);
    this.memberForm.reset({
      registrationId: 'Fetching...',
      gender: Gender.MALE,
      joiningDate: new Date().toISOString().split('T')[0],
      status: MemberStatus.ACTIVE
    });
    
    this.memberService.generateRegistrationId().subscribe(id => {
      this.memberForm.patchValue({ registrationId: id });
    });
    this.showModal.set(true);
  }

  onEdit(member: Member) {
    this.isEditing.set(true);
    this.editingId.set(member.id!);
    this.currentStep.set(1);
    this.memberForm.patchValue(member);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.router.navigate([], { queryParams: { action: null }, queryParamsHandling: 'merge' });
  }

  onSubmitMember() {
    if (this.memberForm.valid) {
      const data = this.memberForm.value;
      if (this.isEditing()) {
        this.memberService.updateMember(this.editingId()!, data).subscribe(() => {
          this.notif.show('Profile updated!', 'success');
          this.loadData();
          this.currentStep.set(2);
        });
      } else {
        this.memberService.addMember(data).subscribe(newMember => {
          this.createdMemberId.set(newMember.id!);
          this.notif.show('Basic Info Saved!', 'success');
          this.loadData();
          this.currentStep.set(2);
        });
      }
    }
  }

  togglePlan(plan: Plan) {
    const id = plan.id!;
    let current = this.selectedPlanIds();
    if (current.includes(id)) {
      current = current.filter(i => i !== id);
    } else {
      current = [...current, id];
    }
    this.selectedPlanIds.set(current);
    
    const total = this.plans()
      .filter(p => current.includes(p.id!))
      .reduce((sum, p) => sum + p.price, 0);
      
    this.paymentForm.patchValue({ amount: total, paidAmount: total });
  }

  isPlanSelected(id: any) {
    return this.selectedPlanIds().includes(id);
  }

  onSubmitSubscription() {
    if (this.selectedPlanIds().length > 0) {
      this.currentStep.set(3);
    } else {
      this.notif.show('Please select a plan.', 'error');
    }
  }

  onSubmitPayment() {
    const memberId = this.isEditing() ? this.editingId() : this.createdMemberId();
    const planIds = this.selectedPlanIds();
    
    const subData = {
      memberId: memberId!,
      planId: planIds[0],
      startDate: this.subscriptionForm.value.startDate
    };

    this.subscriptionService.addSubscription(subData as any).subscribe(sub => {
      const payData = {
        subscriptionId: sub.id!,
        ...this.paymentForm.value
      };
      this.paymentService.addPayment(payData as any).subscribe(() => {
        this.notif.show('Registration Complete!', 'success');
        this.loadData();
        this.closeModal();
      });
    });
  }

  // Add-on logic
  openAddonModal(member: Member) {
    this.editingId.set(member.id!);
    this.addonForm.reset({ paymentMode: 'Cash' });
    this.showAddonModal.set(true);
  }

  onAddonPlanChange() {
    const planId = this.addonForm.get('planId')?.value;
    const plan = this.plans().find(p => p.id === Number(planId));
    if (plan) {
      this.addonForm.patchValue({ paidAmount: plan.price });
    }
  }

  onSubmitAddon() {
    if (this.addonForm.valid) {
      const { planId, paidAmount, paymentMode } = this.addonForm.value;
      const subData = {
        memberId: this.editingId()!,
        planId: Number(planId),
        startDate: new Date().toISOString().split('T')[0]
      };

      this.subscriptionService.addSubscription(subData as any).subscribe(sub => {
        const payData = {
          subscriptionId: sub.id!,
          amount: paidAmount,
          paidAmount: paidAmount,
          paymentMode: paymentMode
        };
        this.paymentService.addPayment(payData as any).subscribe(() => {
          this.notif.show('Add-on Service Activated!', 'success');
          this.loadData();
          this.showAddonModal.set(false);
          // Redirect to Diet Plans if it was a diet plan
          const plan = this.plans().find(p => p.id === Number(planId));
          if (plan?.name.toLowerCase().includes('diet')) {
            this.router.navigate(['/diet-plans']);
          }
        });
      });
    }
  }

  async onDelete(member: Member) {
    if (await this.confirm.ask(`Delete ${member.name}?`)) {
      this.memberService.deleteMember(member.id!).subscribe(() => {
        this.notif.show('Deleted', 'error');
        this.loadData();
      });
    }
  }

  goBack() { this.location.back(); }

  filteredMembers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const filter = this.selectedFilter();
    const planId = this.selectedPlanFilter();
    const month = this.selectedMonthFilter();
    const today = new Date();
    today.setHours(0,0,0,0);

    return this.members()
      .map(m => {
        const memberSubs = this.subscriptions().filter(s => s.memberId === m.id);
        let expiryDisplay = 'No Plan';
        let rowClass = '';
        let isExpiringSoon = false;
        let isExpired = true;
        let lastPlanId = null;

        if (memberSubs.length > 0) {
          const latest = memberSubs.sort((a,b) => new Date(b.startDate!).getTime() - new Date(a.startDate!).getTime())[0];
          lastPlanId = latest.planId;
          const plan = this.plans().find(p => p.id === latest.planId);
          if (plan) {
            const expDate = new Date(latest.startDate!);
            expDate.setDate(expDate.getDate() + plan.duration);
            expiryDisplay = expDate.toISOString().split('T')[0];
            
            const diffDays = Math.round((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            if (diffDays < 0) { rowClass = 'expired'; isExpired = true; }
            else if (diffDays <= 7) { rowClass = 'near-expiry'; isExpiringSoon = true; isExpired = false; }
            else { isExpired = false; }
          }
        }

        return { ...m, expiryDisplay, rowClass, isExpiringSoon, isExpired, lastPlanId };
      })
      .filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(term) || m.phone.includes(term);
        if (!matchesSearch) return false;

        if (filter === 'active' && m.isExpired) return false;
        if (filter === 'inactive' && !m.isExpired) return false;
        if (filter === 'expiring' && !m.isExpiringSoon) return false;
        
        if (planId && m.lastPlanId !== Number(planId)) return false;
        
        if (month) {
          const expMonth = new Date(m.expiryDisplay).toLocaleString('default', { month: 'long', year: 'numeric' });
          if (expMonth !== month) return false;
        }

        return true;
      });
  });

  availablePlansForFilter = computed(() => this.plans().map(p => ({ id: p.id, name: p.name })));
  
  availableMonthsForFilter = computed(() => {
    const months = new Set<string>();
    this.members().forEach(m => {
      const mData = this.filteredMembers().find(fm => fm.id === m.id);
      if (mData?.expiryDisplay !== 'No Plan') {
        months.add(new Date(mData!.expiryDisplay).toLocaleString('default', { month: 'long', year: 'numeric' }));
      }
    });
    return Array.from(months);
  });
}
