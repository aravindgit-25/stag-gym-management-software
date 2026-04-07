import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
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
import { StagCheckboxComponent } from '../../shared/components/stag-checkbox/stag-checkbox';
import { StagDropdownComponent, DropdownItem } from '../../shared/components/stag-dropdown/stag-dropdown';

@Component({
  selector: 'app-member',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AppButtonComponent, AppStagTableComponent, AppModalComponent, StagCheckboxComponent, StagDropdownComponent],
  templateUrl: './member.html',
  styleUrl: './member.css'
})
export class MemberComponent implements OnInit {
  memberForm: FormGroup;
  subscriptionForm: FormGroup;
  paymentForm: FormGroup;

  members = signal<Member[]>([]);
  selectedPlanIds = signal<number[]>([]);
  
  planDropdownItems = computed<DropdownItem[]>(() => {
    return this.plans().map(p => ({
      id: p.id,
      label: p.name,
      subLabel: `₹${p.price} - ${p.duration} days`
    }));
  });

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
    { field: 'branchId', header: 'Branch', width: '80px' }
  ]);

  onViewInvoice(member: any): void {
    const mId = member.id;
    // Find the latest subscription for this member
    const memberSubs = this.subscriptions()
      .filter(s => Number(s.memberId || (s as any).member_id) === mId)
      .sort((a, b) => {
        const dateA = a.startDate || (a as any).start_date;
        const dateB = b.startDate || (b as any).start_date;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

    if (memberSubs.length > 0) {
      const latestSubId = memberSubs[0].id;
      // Find payment for this subscription
      this.paymentService.getPayments().subscribe(payments => {
        const payment = payments.find(p => Number(p.subscriptionId || (p as any).subscription_id) === Number(latestSubId));
        if (payment) {
          const url = window.location.origin + window.location.pathname + `#/invoice/${payment.id}`;
          window.open(url, '_blank');
        } else {
          this.notif.show('No payment record found for the latest subscription.', 'error');
        }
      });
    } else {
      this.notif.show('No subscription found for this member.', 'error');
    }
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      registrationId: 'Reg ID',
      name: 'Full Name',
      phone: 'Phone Number',
      expiryDisplay: 'Plan Expiry',
    };
    return fieldNames[fieldName] || fieldName;
  }

  constructor(private fb: FormBuilder) {
    this.memberForm = this.fb.group({
      registrationId: [''],
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      gender: ['Male', Validators.required],
      branchId: [1, Validators.required]
    });

    this.subscriptionForm = this.fb.group({
      planId: [''], // Will store comma separated IDs for compatibility
      startDate: [new Date().toISOString().split('T')[0], Validators.required]
    });

    this.paymentForm = this.fb.group({
      amount: [{ value: '', disabled: true }, [Validators.required, Validators.min(1)]],
      paidAmount: ['', [Validators.required, Validators.min(0)]],
      balanceAmount: [{ value: 0, disabled: true }],
      balanceDueDate: [''],
      paymentMode: ['Cash', Validators.required]
    });

    // Auto-calculate balance
    this.paymentForm.valueChanges.subscribe(() => {
      const total = this.paymentForm.get('amount')?.value || 0;
      const paid = this.paymentForm.get('paidAmount')?.value || 0;
      const balance = total - paid;

      this.paymentForm.get('balanceAmount')?.setValue(balance, { emitEvent: false });

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

  togglePlan(plan: Plan) {
    const current = this.selectedPlanIds();
    const id = Number(plan.id);
    let updated: number[];

    if (id !== 0) {
      if (current.includes(id)) {
        updated = current.filter(i => i !== id);
      } else {
        updated = [...current, id];
      }
    } else {
      updated = current; // Called from dropdown change which already updated the signal
    }

    this.selectedPlanIds.set(updated);
    this.subscriptionForm.get('planId')?.setValue(updated.join(','));

    const total = this.plans()
      .filter(p => updated.includes(Number(p.id)))
      .reduce((sum, p) => sum + p.price, 0);

    this.paymentForm.patchValue({
      amount: total,
      paidAmount: total,
      balanceAmount: 0
    });
  }

  isPlanSelected(planId: any): boolean {
    return this.selectedPlanIds().includes(Number(planId));
  }

  loadData(): void {
    this.loading.set(true);
    forkJoin({
      members: this.memberService.getMembers().pipe(catchError(() => of([]))),
      plans: this.planService.getPlans().pipe(catchError(() => of([]))),
      subscriptions: this.subscriptionService.getSubscriptions().pipe(catchError(() => of([])))
    }).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe(result => {
      this.members.set(result.members);
      this.plans.set(result.plans);
      this.subscriptions.set(result.subscriptions);
      if (result.members.length === 0 && result.plans.length === 0 && result.subscriptions.length === 0) {
        this.notif.show('Could not fetch data. Backend might be starting up...', 'success');
      }
    });
  }

  loadMembers(): void {
    this.loadData();
  }

  openAddModal() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.createdMemberId.set(null);
    this.currentStep.set(1);
    this.selectedPlanIds.set([]);
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
        this.notif.show('Error fetching registration ID. Please retry.', 'error');
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
    this.currentStep.set(2);
    this.selectedPlanIds.set([]);
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
      const memberData = this.memberForm.getRawValue();

      if (this.isEditing()) {
        this.memberService.updateMember(this.editingId()!, memberData).subscribe({
          next: () => {
            this.notif.show('Member updated successfully!', 'success');
            this.loadData();
            this.showModal.set(false);
          },
          error: (err) => this.notif.show('Error updating member.', 'error')
        });
      } else {
        // Save Member immediately as per user request to have "resume" capability later
        this.memberService.addMember(memberData).subscribe({
          next: (newMember) => {
            this.notif.show('Member registered! Proceed to select plan.', 'success');
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
    if (this.selectedPlanIds().length === 0) {
      this.notif.show('Please select at least one plan.', 'error');
      return;
    }

    if (this.subscriptionForm.valid) {
      this.currentStep.set(3);
    }
  }

  onSubmitPayment() {
    if (this.paymentForm.valid) {
      const rawForm = this.paymentForm.getRawValue();
      const memberId = Number(this.createdMemberId());
      const subFormData = this.subscriptionForm.getRawValue();

      const subPayload = { 
        ...subFormData, 
        memberId: memberId 
      };

      this.subscriptionService.addSubscription(subPayload).subscribe({
        next: (newSub) => {
          const payData = {
            subscriptionId: newSub.id!,
            amount: Number(rawForm.amount),
            paidAmount: Number(rawForm.paidAmount),
            balanceAmount: Number(rawForm.balanceAmount),
            balanceDueDate: rawForm.balanceDueDate || null,
            paymentMode: rawForm.paymentMode
          };

          this.paymentService.addPayment(payData as any).subscribe({
            next: (newPay) => {
              this.notif.show('Payment successful!', 'success');
              this.showModal.set(false);
              this.loadData();
              
              const invoiceId = newPay.id;
              const memberName = this.memberForm.get('name')?.value;
              let phone = this.memberForm.get('phone')?.value;
              const amount = rawForm.paidAmount;

              // Ensure phone has country code (default to 91 for India if not present)
              if (phone && phone.length === 10) phone = '91' + phone;

              const invoiceUrl = window.location.origin + window.location.pathname + `#/invoice/${invoiceId}`;
              
              // Construct WhatsApp Message
              const message = `Hello *${memberName}*,\n\nThank you for choosing *STAG FITNESS*! \n\nYour payment of *₹${amount}* has been received successfully. \n\nYou can view and download your invoice here:\n${invoiceUrl}\n\nHave a great workout!`;
              const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;

              // Open Invoice and WhatsApp
              setTimeout(() => {
                window.open(invoiceUrl, '_blank');
                // Small delay for WhatsApp to avoid popup blockers
                setTimeout(() => window.open(waUrl, '_blank'), 500);
              }, 100);
            },
            error: (err) => {
              console.error('Payment save error:', err);
              this.notif.show('Error saving payment. Check if all fields are correct.', 'error');
            }
          });
        },
        error: (err) => {
          console.error('Subscription save error:', err);
          this.notif.show('Error saving subscription.', 'error');
        }
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
        let priority = 3;

        if (memberSubs.length > 0) {
          const lastSub = memberSubs[0];
          const sPlanId = lastSub.planId || (lastSub as any).plan_id;

          const planIds = typeof sPlanId === 'string' ? sPlanId.split(',').map(Number) : [Number(sPlanId)];
          const relevantPlans = this.plans().filter(p => planIds.includes(Number(p.id)));

          const maxDuration = Math.max(...relevantPlans.map(p => p.duration || 0), 0);

          const sDate = lastSub.startDate || (lastSub as any).start_date;

          if (relevantPlans.length > 0 && sDate) {
            const expDate = new Date(sDate);
            expDate.setDate(expDate.getDate() + maxDuration);
            expiryDisplay = expDate.toISOString().split('T')[0];

            const expMidnight = new Date(expDate);
            expMidnight.setHours(0,0,0,0);

            const diffTime = expMidnight.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
              rowClass = 'expired';
              canRenew = true;
              priority = 1;
            } else if (diffDays <= 3) {
              rowClass = 'near-expiry';
              canRenew = true;
              priority = 2;
            } else {
              canRenew = false;
              priority = 3;
            }
          }
        } else {
           priority = 0;
           canRenew = true; // Set to true to show the "Complete Setup" button
        }

        // Logical Fix: Show "Complete Setup" if no subscriptions exist
        const renewLabel = memberSubs.length === 0 ? 'Complete Setup' : (canRenew ? 'Renew' : '');
        const renewLabelClass = memberSubs.length === 0 ? 'btn-blue' : (rowClass === 'expired' ? 'btn-red' : (rowClass === 'near-expiry' ? 'btn-yellow' : 'btn-blue'));

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
