import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MemberService } from '../../services/member.service';
import { PlanService } from '../../services/plan.service';
import { SubscriptionService } from '../../services/subscription.service';
import { PaymentService } from '../../services/payment.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';
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
  showViewModal = signal<boolean>(false);
  selectedMemberName = signal<string>('');
  selectedSubDetails = signal<any>(null);

  paymentModes = ['Cash', 'UPI', 'Card', 'Bank Transfer'];
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notif = inject(NotificationService);
  private confirm = inject(ConfirmService);

  // Filtered display list showing ONLY the latest subscription per member
  displayList = computed(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const list = this.subscriptionsList();
    
    // Step 1: Map to find the latest subscription for each member
    const latestMap = new Map<number, any>();
    
    list.forEach(sub => {
      const mId = Number(sub.memberId || (sub as any).member_id);
      const sDate = new Date(sub.startDate || (sub as any).start_date).getTime();
      const sId = sub.id!;

      const existing = latestMap.get(mId);
      if (!existing || sDate > existing.dateTime || (sDate === existing.dateTime && sId > existing.id)) {
        latestMap.set(mId, { id: sId, dateTime: sDate, sub });
      }
    });

    // Step 2: Only process and return the latest records
    return Array.from(latestMap.values()).map(item => {
      const sub = item.sub;
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
    }).sort((a, b) => b.id! - a.id!);
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
        this.notif.show('Error loading subscriptions', 'error');
        this.loading.set(false);
      }
    });
  }

  openViewModal(sub: any): void {
    this.loading.set(true);
    const member = this.members().find(m => m.id === Number(sub.memberId));
    const plan = this.plans().find(p => p.id === Number(sub.planId));
    
    this.paymentService.getPayments().subscribe({
      next: (payments) => {
        const payment = payments.find(p => p.subscriptionId === Number(sub.id));
        
        this.selectedSubDetails.set({
          ...sub,
          member,
          plan,
          payment
        });
        this.showViewModal.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.notif.show('Error loading payment details', 'error');
        this.loading.set(false);
      }
    });
  }

  reInvoice(): void {
    const details = this.selectedSubDetails();
    if (details && details.payment) {
      this.router.navigate(['/invoice', details.payment.id]);
    } else {
      this.notif.show('No payment found for this subscription.', 'error');
    }
  }

  addInvoice(): void {
    this.reInvoice();
  }

  closeViewModal(): void {
    this.showViewModal.set(false);
    this.selectedSubDetails.set(null);
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

  async onSaveRenewal() {
    if (this.renewalForm.valid) {
      const confirmed = await this.confirm.ask('Are you sure you want to renew this membership and record payment?');
      if (!confirmed) return;

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
            paidAmount: formVal.amount,
            balanceAmount: 0,
            paymentMode: formVal.paymentMode
          };

          this.paymentService.addPayment(paymentData).subscribe({
            next: () => {
              this.notif.show('Membership renewed and payment recorded!', 'success');
              this.loadSubscriptions();
              this.closeModal();
            },
            error: (err) => this.notif.show('Subscription created but Payment failed.', 'error')
          });
        },
        error: (err) => this.notif.show('Failed to create new subscription.', 'error')
      });
    }
  }

  async onSubmit() {
    if (this.subscriptionForm.valid) {
      const confirmed = await this.confirm.ask('Are you sure you want to save this subscription?');
      if (!confirmed) return;

      this.subscriptionService.addSubscription(this.subscriptionForm.value).subscribe({
        next: (newSub) => {
          this.notif.show('Subscription saved successfully!', 'success');
          this.loadSubscriptions();
          this.subscriptionForm.reset({
            startDate: new Date().toISOString().split('T')[0]
          });
        },
        error: (err) => this.notif.show('Failed to save subscription.', 'error')
      });
    }
  }
}
