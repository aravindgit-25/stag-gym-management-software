import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MemberService } from '../../services/member.service';
import { SubscriptionService } from '../../services/subscription.service';
import { PlanService } from '../../services/plan.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';
import { Member } from '../../models/member.model';
import { Subscription } from '../../models/subscription.model';
import { Plan } from '../../models/plan.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';
import { AppTableComponent, TableColumn } from '../../shared/components/app-table/app-table';

@Component({
  selector: 'app-member',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AppButtonComponent, AppTableComponent],
  templateUrl: './member.html',
  styleUrl: './member.css'
})
export class MemberComponent implements OnInit {
  memberForm: FormGroup;
  members = signal<Member[]>([]);
  subscriptions = signal<Subscription[]>([]);
  plans = signal<Plan[]>([]);
  searchTerm = signal<string>('');
  loading = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);
  
  private router = inject(Router);
  private notif = inject(NotificationService);
  private confirm = inject(ConfirmService);

  columns: TableColumn[] = [
    { field: 'registrationId', header: 'Reg ID' },
    { field: 'name', header: 'Name' },
    { field: 'phone', header: 'Phone' },
    { field: 'expiryDisplay', header: 'Expiry Date' }
  ];

  filteredMembers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const today = new Date();
    today.setHours(0,0,0,0);

    return this.members()
      .filter(m => m.name.toLowerCase().includes(term) || m.phone.includes(term))
      .map(m => {
        const mId = m.id;
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
            } else if (diffDays <= 3) {
              rowClass = 'near-expiry';
              canRenew = true;
            } else {
              canRenew = false;
            }
          }
        }

        return { ...m, expiryDisplay, rowClass, canRenew };
      });
  });

  constructor(
    private fb: FormBuilder, 
    private memberService: MemberService,
    private subscriptionService: SubscriptionService,
    private planService: PlanService
  ) {
    this.memberForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      gender: ['Male', Validators.required],
      branchId: [1, Validators.required]
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

  onEdit(member: Member): void {
    this.isEditing.set(true);
    this.editingId.set(member.id || null);
    this.memberForm.patchValue(member);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onRenew(member: any): void {
    this.router.navigate(['/subscriptions'], { queryParams: { memberId: member.id } });
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

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.memberForm.reset({ gender: 'Male', branchId: 1 });
  }

  async onSubmit() {
    if (this.memberForm.valid) {
      const memberData = this.memberForm.value;
      const action = this.isEditing() ? 'update' : 'add';
      
      const confirmed = await this.confirm.ask(`Are you sure you want to ${action} this member?`);
      if (!confirmed) return;

      if (this.isEditing()) {
        this.memberService.updateMember(this.editingId()!, memberData).subscribe({
          next: (updated) => {
            this.notif.show('Member updated successfully!', 'success');
            this.members.update(prev => prev.map(m => m.id === updated.id ? updated : m));
            this.cancelEdit();
          },
          error: (err) => this.notif.show('Error updating member.', 'error')
        });
      } else {
        this.memberService.addMember(memberData).subscribe({
          next: (newMember) => {
            this.notif.show('Member added successfully!', 'success');
            this.members.update(prev => [...prev, newMember]);
            this.memberForm.reset({ gender: 'Male', branchId: 1 });
          },
          error: (err) => this.notif.show('Error adding member.', 'error')
        });
      }
    }
  }
}
