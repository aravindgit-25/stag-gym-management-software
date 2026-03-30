import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MemberService } from '../../services/member.service';
import { SubscriptionService } from '../../services/subscription.service';
import { PlanService } from '../../services/plan.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';
import { PaymentService } from '../../services/payment.service';
import { Member } from '../../models/member.model';
import { Subscription } from '../../models/subscription.model';
import { Plan } from '../../models/plan.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';
import { AppStagTableComponent, StagTableColumn } from '../../shared/components/stag-table/stag-table';
import { AppModalComponent } from '../../shared/components/app-modal/app-modal';

@Component({
  selector: 'app-member',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AppButtonComponent, AppStagTableComponent, AppModalComponent],
  templateUrl: './member.html',
  styleUrl: './member.css'
})
export class MemberComponent implements OnInit {
  memberForm: FormGroup;
  subscriptionForm: FormGroup;
  paymentForm: FormGroup;

  members = signal<Member[]>([]);
  subscriptions = signal<Subscription[]>([]);
  plans = signal<Plan[]>([]);
  searchTerm = signal<string>('');
  loading = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);
  editingRowIndex = signal<number | null>(null);
  tableHeight = signal<string>('calc(100vh - 220px)');
  showModal = signal<boolean>(false);
  
  // Wizard State
  currentStep = signal<number>(1);
  createdMemberId = signal<number | null>(null);
  createdSubId = signal<number | null>(null);
  paymentModes = ['Cash', 'UPI', 'Card', 'Bank Transfer'];

  private router = inject(Router);
  private location = inject(Location);
  private notif = inject(NotificationService);
  private confirm = inject(ConfirmService);
  private memberService = inject(MemberService);
  private subscriptionService = inject(SubscriptionService);
  private paymentService = inject(PaymentService);
  private planService = inject(PlanService);

  tableColumns = computed<StagTableColumn[]>(() => [
    { field: 'registrationId', header: this.getFieldDisplayName('registrationId'), width: '120px' },
    { field: 'name', header: this.getFieldDisplayName('name') },
    { field: 'phone', header: this.getFieldDisplayName('phone'), width: '150px' },
    { field: 'expiryDisplay', header: this.getFieldDisplayName('expiryDisplay'), width: '150px' },
    { field: 'renewLabel', header: 'Renewal', type: 'action-button', width: '100px' },
    { field: 'branchId', header: 'Branch', width: '80px' }
  ]);

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      registrationId: 'Reg ID',
      name: 'Full Name',
      phone: 'Phone Number',
      expiryDisplay: 'Expiry Date',
    };
    return fieldNames[fieldName] || fieldName;
  }

  constructor(private fb: FormBuilder) {
    this.memberForm = this.fb.group({
      registrationId: ['Fetching...'],
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      gender: ['Male', Validators.required],
      branchId: [1, Validators.required]
    });

    this.subscriptionForm = this.fb.group({
      planId: ['', Validators.required],
      startDate: [new Date().toISOString().split('T')[0], Validators.required]
    });

    this.paymentForm = this.fb.group({
      amount: [{ value: '', disabled: true }, [Validators.required, Validators.min(1)]],
      paidAmount: ['', [Validators.required, Validators.min(0)]],
      balanceAmount: [{ value: 0, disabled: true }],
      balanceDueDate: [''],
      paymentMode: ['Cash', Validators.required]
    });

    // Auto-fill amount when plan changes
    this.subscriptionForm.get('planId')?.valueChanges.subscribe(planId => {
      const plan = this.plans().find(p => p.id === Number(planId));
      if (plan) {
        this.paymentForm.patchValue({ 
          amount: plan.price,
          paidAmount: plan.price,
          balanceAmount: 0
        });
      }
    });

    // Auto-calculate balance
    this.paymentForm.valueChanges.subscribe(() => {
      const total = this.paymentForm.get('amount')?.value || 0;
      const paid = this.paymentForm.get('paidAmount')?.value || 0;
      const balance = total - paid;
      
      this.paymentForm.get('balanceAmount')?.setValue(balance, { emitEvent: false });
      
      // If balance exists, set a default due date (e.g., 7 days from now) if empty
      if (balance > 0 && !this.paymentForm.get('balanceDueDate')?.value) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        this.paymentForm.get('balanceDueDate')?.setValue(nextWeek.toISOString().split('T')[0], { emitEvent: false });
      } else if (balance <= 0) {
        this.paymentForm.get('balanceDueDate')?.setValue('', { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.memberService.getMembers().subscribe(data => this.members.set(data));
    this.planService.getPlans().subscribe(data => this.plans.set(data));
    this.subscriptionService.getSubscriptions().subscribe({
      next: (data) => {
        this.subscriptions.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.notif.show('Error fetching data', 'error');
        this.loading.set(false);
      }
    });
  }

  loadMembers(): void {
    this.loadData();
  }

  openAddModal() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.currentStep.set(1);
    this.memberForm.reset({ 
      registrationId: 'Fetching...',
      gender: 'Male', 
      branchId: 1 
    });
    this.subscriptionForm.reset({
      startDate: new Date().toISOString().split('T')[0]
    });
    this.paymentForm.reset({
      paymentMode: 'Cash'
    });
    
    this.memberService.generateRegistrationId().subscribe({
      next: (id) => {
        this.memberForm.patchValue({ registrationId: id });
      },
      error: (err) => {
        console.error('Registration ID fetch failed:', err);
        this.notif.show('Error fetching registration ID', 'error');
        this.memberForm.patchValue({ registrationId: 'SG-ERR' });
      }
    });
    
    this.showModal.set(true);
  }

  onEdit(member: Member): void {
    this.isEditing.set(true);
    this.editingId.set(member.id || null);
    this.currentStep.set(1);
    this.memberForm.patchValue({
      registrationId: member.registrationId,
      name: member.name,
      phone: member.phone,
      gender: member.gender,
      branchId: member.branchId
    });
    this.showModal.set(true);
  }

  onRenew(member: any): void {
    this.isEditing.set(false);
    this.createdMemberId.set(member.id);
    this.currentStep.set(2); // Jump to Plan selection
    this.subscriptionForm.reset({
      startDate: new Date().toISOString().split('T')[0]
    });
    this.showModal.set(true);
  }

  async onDelete(member: Member) {
    const confirmed = await this.confirm.ask(`Are you sure you want to delete member: ${member.name}?`);
    if (confirmed) {
      this.memberService.deleteMember(member.id!).subscribe({
        next: () => {
          this.notif.show('Member deleted successfully!', 'error');
          this.members.update(prev => prev.filter(m => m.id !== member.id));
        },
        error: (err) => this.notif.show('Failed to delete member.', 'error')
      });
    }
  }

  closeModal(): void {
    this.showModal.set(false);
    this.currentStep.set(1);
  }

  async onSubmitMember() {
    if (this.memberForm.valid) {
      const memberData = this.memberForm.getRawValue(); // use getRawValue to include registrationId
      
      if (this.isEditing()) {
        this.memberService.updateMember(this.editingId()!, memberData).subscribe({
          next: (updated) => {
            this.notif.show('Member updated successfully!', 'success');
            this.loadData();
            this.showModal.set(false);
          },
          error: (err) => this.notif.show('Error updating member.', 'error')
        });
      } else {
        this.memberService.addMember(memberData).subscribe({
          next: (newMember) => {
            this.notif.show('Member registered! Now select a plan.', 'success');
            this.createdMemberId.set(newMember.id!);
            this.loadData();
            this.currentStep.set(2); 
          },
          error: (err) => this.notif.show('Error adding member.', 'error')
        });
      }
    }
  }

  onSubmitSubscription() {
    if (this.subscriptionForm.valid) {
      const subData = {
        ...this.subscriptionForm.value,
        memberId: this.createdMemberId()
      };

      this.subscriptionService.addSubscription(subData).subscribe({
        next: (newSub) => {
          this.notif.show('Plan selected! Proceed to payment.', 'success');
          this.createdSubId.set(newSub.id!);
          this.currentStep.set(3); 
        },
        error: (err) => this.notif.show('Error saving subscription.', 'error')
      });
    }
  }

  onSubmitPayment() {
    if (this.paymentForm.valid) {
      const rawForm = this.paymentForm.getRawValue();
      const subId = Number(this.createdSubId());
      
      const payData = {
        // camelCase
        subscriptionId: subId,
        amount: Number(rawForm.amount),
        paidAmount: Number(rawForm.paidAmount),
        balanceAmount: Number(rawForm.balanceAmount),
        balanceDueDate: rawForm.balanceDueDate || null,
        paymentMode: rawForm.paymentMode,
        
        // snake_case (Backwards compatibility/Spring naming)
        subscription_id: subId,
        paid_amount: Number(rawForm.paidAmount),
        balance_amount: Number(rawForm.balanceAmount),
        balance_due_date: rawForm.balanceDueDate || null,
        payment_mode: rawForm.paymentMode
      };

      this.paymentService.addPayment(payData as any).subscribe({
        next: (newPay) => {
          this.notif.show('Payment successful! Generating invoice...', 'success');
          this.showModal.set(false);
          this.loadData();
          
          const url = this.router.serializeUrl(
            this.router.createUrlTree(['/invoice', newPay.id])
          );
          window.open(url, '_blank');
        },
        error: (err) => this.notif.show('Error saving payment.', 'error')
      });
    }
  }

  onTableSelectionChange(selected: any[]) {
    console.log('Selected members:', selected);
  }

  onMemberGlobalSearch(term: string) {
    this.searchTerm.set(term);
  }

  onRowClick(member: any) {
    console.log('Row clicked:', member);
  }

  goBack(): void {
    this.location.back();
  }

  filteredMembers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const today = new Date();
    today.setHours(0,0,0,0);

    return this.members()
      .filter(m => m.name.toLowerCase().includes(term) || m.phone.includes(term))
      .map(m => {
        const mId = m.id;
        const regId = m.registrationId || (m as any).registration_id || 'N/A';
        const memberSubs = this.subscriptions()
          .filter(s => {
            const sMemberId = s.memberId || (s as any).member_id;
            return Number(sMemberId) === mId;
          })
          .sort((a, b) => {
            const dateA = a.startDate || (a as any).start_date;
            const dateB = b.startDate || (b as any).start_date;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });

        let expiryDisplay = 'No Plan';
        let rowClass = '';
        let canRenew = true;
        let priority = 3; // Default low priority

        if (memberSubs.length > 0) {
          const lastSub = memberSubs[0];
          const sPlanId = lastSub.planId || (lastSub as any).plan_id;
          const plan = this.plans().find(p => p.id === Number(sPlanId));
          const sDate = lastSub.startDate || (lastSub as any).start_date;

          if (plan && sDate) {
            const expDate = new Date(sDate);
            expDate.setDate(expDate.getDate() + (plan.duration || 0));
            expiryDisplay = expDate.toISOString().split('T')[0];
            
            const expMidnight = new Date(expDate);
            expMidnight.setHours(0,0,0,0);
            
            const diffTime = expMidnight.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
              rowClass = 'expired';
              canRenew = true;
              priority = 1; // Highest priority
            } else if (diffDays <= 3) {
              rowClass = 'near-expiry';
              canRenew = true;
              priority = 2; // Medium priority
            } else {
              canRenew = false;
              priority = 3;
            }
          }
        } else {
           priority = 0; // No plan members also priority
        }

        const renewLabel = canRenew ? 'Renew' : '';
        const renewLabelClass = rowClass === 'expired' ? 'btn-red' : (rowClass === 'near-expiry' ? 'btn-yellow' : 'btn-blue');

        return { ...m, registrationId: regId, expiryDisplay, rowClass, canRenew, priority, renewLabel, renewLabelClass };
      })
      .sort((a, b) => {
        if (a.priority === b.priority) {
          return a.name.localeCompare(b.name);
        }
        return a.priority - b.priority;
      });
  });
}
