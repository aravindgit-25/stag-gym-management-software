import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MemberService } from '../../services/member.service';
import { PlanService } from '../../services/plan.service';
import { SubscriptionService } from '../../services/subscription.service';
import { PaymentService } from '../../services/payment.service';
import { Member } from '../../models/member.model';
import { Plan } from '../../models/plan.model';
import { Subscription } from '../../models/subscription.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';
import { AppTableComponent, TableColumn } from '../../shared/components/app-table/app-table';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppButtonComponent, AppTableComponent],
  templateUrl: './subscription.html',
  styleUrl: './subscription.css'
})
export class SubscriptionComponent implements OnInit {
  subscriptionForm: FormGroup;
  renewalForm: FormGroup;
  
  members = signal<Member[]>([]);
  plans = signal<Plan[]>([]);
  subscriptionsList = signal<Subscription[]>([]);
  loading = signal<boolean>(false);
  
  showRenewalModal = signal<boolean>(false);
  selectedMemberName = signal<string>('');

  paymentModes = ['Cash', 'UPI', 'Card', 'Bank Transfer'];
  private route = inject(ActivatedRoute);

  // Normalized display list with proper naming and status
  displayList = computed(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    return this.subscriptionsList().map(sub => {
      // Handle both camelCase and snake_case from backend
      const sId = sub.id;
      const sPlanId = sub.planId || (sub as any).plan_id;
      const sMemberId = sub.memberId || (sub as any).member_id;
      const sDate = sub.startDate || (sub as any).start_date;

      const plan = this.plans().find(p => p.id === Number(sPlanId));
      let expiryDateStr = 'N/A';
      let status = 'Active';
      let rowClass = '';
      let canRenew = false;

      if (plan && sDate) {
        const expDate = new Date(sDate);
        expDate.setDate(expDate.getDate() + Number(plan.duration || 0));
        expiryDateStr = expDate.toISOString().split('T')[0];

        const expMidnight = new Date(expDate);
        expMidnight.setHours(0,0,0,0);
        
        const diffTime = expMidnight.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          status = 'Expired';
          rowClass = 'expired';
          canRenew = true;
        } else if (diffDays <= 3) {
          status = 'Expiring Soon';
          rowClass = 'near-expiry';
          canRenew = true;
        }
      }

      return {
        id: sId,
        memberName: this.members().find(m => m.id === Number(sMemberId))?.name || `Member ${sMemberId}`,
        planName: plan?.name || `Plan ${sPlanId}`,
        startDate: sDate,
        expiryDate: expiryDateStr,
        status,
        rowClass,
        canRenew,
        memberId: sMemberId,
        planId: sPlanId
      };
    });
  });

  columns: TableColumn[] = [
    { field: 'id', header: 'ID' },
    { field: 'memberName', header: 'Member Name' },
    { field: 'planName', header: 'Plan Name' },
    { field: 'startDate', header: 'Start Date' },
    { field: 'expiryDate', header: 'Expiry Date' },
    { field: 'status', header: 'Status' }
  ];

  constructor(
    private fb: FormBuilder,
    private memberService: MemberService,
    private planService: PlanService,
    private subscriptionService: SubscriptionService,
    private paymentService: PaymentService
  ) {
    this.subscriptionForm = this.fb.group({
      memberId: ['', Validators.required],
      planId: ['', Validators.required],
      startDate: [new Date().toISOString().split('T')[0], Validators.required]
    });

    this.renewalForm = this.fb.group({
      memberId: ['', Validators.required],
      planId: ['', Validators.required],
      startDate: [new Date().toISOString().split('T')[0], Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      paymentMode: ['Cash', Validators.required]
    });

    // Automatically update price when plan changes in renewal popup
    this.renewalForm.get('planId')?.valueChanges.subscribe(planId => {
      const plan = this.plans().find(p => p.id === Number(planId));
      if (plan) {
        this.renewalForm.patchValue({ amount: plan.price }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.loadSubscriptions();
    
    // Handle query param from Member screen
    this.route.queryParams.subscribe(params => {
      if (params['memberId']) {
        this.subscriptionForm.patchValue({ memberId: params['memberId'] });
      }
    });
  }

  loadData(): void {
    this.memberService.getMembers().subscribe(data => this.members.set(data));
    this.planService.getPlans().subscribe(data => this.plans.set(data));
  }

  loadSubscriptions(): void {
    this.loading.set(true);
    this.subscriptionService.getSubscriptions().subscribe({
      next: (data) => {
        this.subscriptionsList.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading subscriptions', err);
        this.loading.set(false);
      }
    });
  }

  openRenewPopup(sub: any): void {
    this.selectedMemberName.set(sub.memberName);
    this.renewalForm.patchValue({
      memberId: sub.memberId,
      planId: sub.planId,
      startDate: new Date().toISOString().split('T')[0]
    });
    this.showRenewalModal.set(true);
  }

  closeModal(): void {
    this.showRenewalModal.set(false);
    this.renewalForm.reset({ paymentMode: 'Cash' });
  }

  onSaveRenewal(): void {
    if (this.renewalForm.valid) {
      const formVal = this.renewalForm.value;
      const subData = {
        memberId: formVal.memberId,
        planId: formVal.planId,
        startDate: formVal.startDate
      };

      this.subscriptionService.addSubscription(subData).subscribe({
        next: (newSub) => {
          const paymentData = {
            subscriptionId: newSub.id!,
            amount: formVal.amount,
            paymentMode: formVal.paymentMode
          };

          this.paymentService.addPayment(paymentData).subscribe({
            next: () => {
              alert('Membership renewed and payment recorded!');
              this.loadSubscriptions(); // Refresh list to show latest status
              this.closeModal();
            },
            error: (err) => alert('Subscription created but Payment failed.')
          });
        },
        error: (err) => alert('Failed to create new subscription.')
      });
    }
  }

  onSubmit(): void {
    if (this.subscriptionForm.valid) {
      this.subscriptionService.addSubscription(this.subscriptionForm.value).subscribe({
        next: (newSub) => {
          alert('Subscription saved successfully!');
          this.loadSubscriptions();
          this.subscriptionForm.reset({
            startDate: new Date().toISOString().split('T')[0]
          });
        },
        error: (err) => alert('Failed to save subscription.')
      });
    }
  }
}
