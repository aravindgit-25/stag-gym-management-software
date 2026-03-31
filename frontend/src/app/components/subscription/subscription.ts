import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { Payment } from '../../models/payment.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';
import { AppStagTableComponent, StagTableColumn } from '../../shared/components/stag-table/stag-table';
import { StagCheckboxComponent } from '../../shared/components/stag-checkbox/stag-checkbox';
import { StagDropdownComponent, DropdownItem } from '../../shared/components/stag-dropdown/stag-dropdown';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppButtonComponent, AppStagTableComponent, StagCheckboxComponent, StagDropdownComponent],
  templateUrl: './subscription.html',
  styleUrl: './subscription.css'
})
export class SubscriptionComponent implements OnInit {
  renewalForm: FormGroup;
  selectedPlanIds = signal<number[]>([]);
  
  planDropdownItems = computed<DropdownItem[]>(() => {
    return this.plans().map(p => ({
      id: p.id,
      label: p.name,
      subLabel: `₹${p.price}`
    }));
  });

  members = signal<Member[]>([]);
  plans = signal<Plan[]>([]);
  subscriptionsList = signal<Subscription[]>([]);
  paymentsList = signal<Payment[]>([]);
  loading = signal<boolean>(false);
  
  showRenewalModal = signal<boolean>(false);
  showViewModal = signal<boolean>(false);
  showCompletePaymentModal = signal<boolean>(false);
  selectedMemberName = signal<string>('');
  selectedSubDetails = signal<any>(null);

  paymentModes = ['Cash', 'UPI', 'Card', 'Bank Transfer'];
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private notif = inject(NotificationService);
  private confirm = inject(ConfirmService);

  displayList = computed(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const list = this.subscriptionsList();
    const payments = this.paymentsList();
    
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

    return Array.from(latestMap.values()).map(item => {
      const sub = item.sub;
      const sId = sub.id;
      const sPlanId = sub.planId || (sub as any).plan_id;
      const sMemberId = sub.memberId || (sub as any).member_id;
      const sDate = sub.startDate || (sub as any).start_date;

      const planIds = typeof sPlanId === 'string' ? sPlanId.split(',').map(Number) : [Number(sPlanId)];
      const relevantPlans = this.plans().filter(p => planIds.includes(Number(p.id)));
      const planNames = relevantPlans.map(p => p.name).join(' + ');
      const totalDuration = Math.max(...relevantPlans.map(p => p.duration || 0), 0);
      
      const hasPayment = payments.some(p => Number(p.subscriptionId || (p as any).subscription_id) === Number(sId));
      const paymentStatus = hasPayment ? 'Paid' : 'Pending';

      let expiryDateStr = 'N/A';
      let status = 'Active';
      let rowClass = hasPayment ? '' : 'payment-pending';
      let canRenew = false;
      
      let renewal = '';
      let renewalClass = '';

      if (relevantPlans.length > 0 && sDate) {
        const expDate = new Date(sDate);
        expDate.setDate(expDate.getDate() + totalDuration);
        expiryDateStr = expDate.toISOString().split('T')[0];

        const expMidnight = new Date(expDate);
        expMidnight.setHours(0,0,0,0);
        
        const diffTime = expMidnight.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          status = 'Expired';
          rowClass = 'expired';
          canRenew = true;
          renewal = 'Renew Now';
          renewalClass = 'btn-red';
        } else if (diffDays <= 3) {
          status = 'Expiring Soon';
          rowClass = 'near-expiry';
          canRenew = true;
          renewal = `${diffDays === 0 ? 'Today' : diffDays + ' Days'}`;
          renewalClass = 'btn-yellow';
        }
      }

      return {
        id: sId,
        memberName: this.members().find(m => m.id === Number(sMemberId))?.name || `Member ${sMemberId}`,
        planName: planNames || 'Unknown Plan',
        startDate: sDate,
        expiryDate: expiryDateStr,
        status,
        paymentStatus,
        renewal,
        renewalClass,
        rowClass,
        canRenew,
        memberId: sMemberId,
        planId: sPlanId
      };
    }).sort((a, b) => b.id! - a.id!);
  });

  columns: StagTableColumn[] = [
    { field: 'id', header: 'ID', width: '70px' },
    { field: 'memberName', header: 'Member Name' },
    { field: 'planName', header: 'Plans' },
    { field: 'startDate', header: 'Start Date' },
    { field: 'expiryDate', header: 'Expiry Date' },
    { field: 'status', header: 'Status' },
    { field: 'paymentStatus', header: 'Payment', width: '100px' },
    { field: 'renewal', header: 'Renewal', width: '120px', type: 'action-button' }
  ];

  constructor(
    private fb: FormBuilder,
    private memberService: MemberService,
    private planService: PlanService,
    private subscriptionService: SubscriptionService,
    private paymentService: PaymentService
  ) {
    this.renewalForm = this.fb.group({
      memberId: ['', Validators.required],
      planId: [''],
      startDate: [new Date().toISOString().split('T')[0], Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      paymentMode: ['Cash', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.loadSubscriptions();
  }

  loadData(): void {
    this.memberService.getMembers().subscribe(data => this.members.set(data));
    this.planService.getPlans().subscribe(data => this.plans.set(data));
    this.paymentService.getPayments().subscribe(data => this.paymentsList.set(data));
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

  togglePlan(plan: Plan) {
    const current = this.selectedPlanIds();
    const id = Number(plan.id);
    let updated: number[];
    
    if (current.includes(id)) {
      updated = current.filter(i => i !== id);
    } else {
      updated = [...current, id];
    }
    
    this.selectedPlanIds.set(updated);
    this.renewalForm.get('planId')?.setValue(updated.join(','));
    
    const total = this.plans()
      .filter(p => updated.includes(Number(p.id)))
      .reduce((sum, p) => sum + p.price, 0);
      
    this.renewalForm.patchValue({ amount: total });
  }

  isPlanSelected(planId: any): boolean {
    return this.selectedPlanIds().includes(Number(planId));
  }

  goBack(): void {
    this.location.back();
  }

  openViewModal(sub: any): void {
    this.loading.set(true);
    const member = this.members().find(m => m.id === Number(sub.memberId));
    
    const planIds = typeof sub.planId === 'string' ? sub.planId.split(',').map(Number) : [Number(sub.planId)];
    const plans = this.plans().filter(p => planIds.includes(Number(p.id)));
    
    this.paymentService.getPayments().subscribe({
      next: (payments) => {
        this.paymentsList.set(payments);
        const payment = payments.find(p => Number(p.subscriptionId || (p as any).subscription_id) === Number(sub.id));
        
        this.selectedSubDetails.set({
          ...sub,
          member,
          plans,
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
      this.router.navigate(['/invoice', details.payment.id || (details.payment as any).id]);
    } else {
      this.notif.show('No payment found for this subscription.', 'error');
    }
  }

  addInvoice(): void {
    this.reInvoice();
  }

  openCompletePaymentPopup(details: any): void {
    this.selectedMemberName.set(details.member?.name || 'Member');
    
    const totalAmount = (details.plans as Plan[])?.reduce((sum, p) => sum + p.price, 0) || details.plan?.price || 0;
    
    this.renewalForm.patchValue({
      memberId: details.memberId,
      planId: details.planId,
      startDate: details.startDate,
      amount: totalAmount
    });
    this.showViewModal.set(false);
    this.showCompletePaymentModal.set(true);
  }

  closeCompletePaymentModal(): void {
    this.showCompletePaymentModal.set(false);
    this.renewalForm.reset({ paymentMode: 'Cash' });
  }

  async onSaveCompletePayment() {
    if (this.renewalForm.valid) {
      const details = this.selectedSubDetails();
      const formVal = this.renewalForm.value;
      
      const paymentData = {
        subscriptionId: details.id,
        amount: Number(formVal.amount),
        paidAmount: Number(formVal.amount),
        balanceAmount: 0,
        paymentMode: formVal.paymentMode
      };

      this.paymentService.addPayment(paymentData as any).subscribe({
        next: (pay) => {
          this.notif.show('Payment recorded successfully!', 'success');
          this.loadData();
          this.loadSubscriptions();
          this.closeCompletePaymentModal();
          this.router.navigate(['/invoice', pay.id]);
        },
        error: (err) => this.notif.show('Failed to record payment.', 'error')
      });
    }
  }

  closeViewModal(): void {
    this.showViewModal.set(false);
    this.selectedSubDetails.set(null);
  }

  openRenewPopup(sub: any): void {
    this.selectedMemberName.set(sub.memberName);
    this.selectedPlanIds.set([]);
    this.renewalForm.patchValue({
      memberId: sub.memberId,
      planId: '',
      startDate: new Date().toISOString().split('T')[0],
      amount: ''
    });
    this.showRenewalModal.set(true);
  }

  closeModal(): void {
    this.showRenewalModal.set(false);
    this.renewalForm.reset({ paymentMode: 'Cash' });
    this.selectedPlanIds.set([]);
  }

  async onSaveRenewal() {
    if (this.selectedPlanIds().length === 0) {
      this.notif.show('Please select at least one plan.', 'error');
      return;
    }

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
              this.loadData();
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
}
