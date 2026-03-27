import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MemberService } from '../../services/member.service';
import { SubscriptionService } from '../../services/subscription.service';
import { PlanService } from '../../services/plan.service';
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

  columns: TableColumn[] = [
    { field: 'id', header: 'ID' },
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
        // Calculate expiry date from subscriptions
        const memberSubs = this.subscriptions()
          .filter(s => Number(s.memberId) === m.id)
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

        let expiryDate: Date | null = null;
        if (memberSubs.length > 0) {
          const lastSub = memberSubs[0];
          const plan = this.plans().find(p => p.id === Number(lastSub.planId));
          if (plan) {
            expiryDate = new Date(lastSub.startDate);
            expiryDate.setDate(expiryDate.getDate() + plan.duration);
          }
        }

        let rowClass = '';
        let canRenew = false;
        let expiryDisplay = 'No Plan';

        if (expiryDate) {
          expiryDisplay = expiryDate.toISOString().split('T')[0];
          const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            rowClass = 'expired';
            canRenew = true;
          } else if (diffDays <= 3) {
            rowClass = 'near-expiry';
            canRenew = true;
          }
        } else {
          canRenew = true; // No plan means they can subscribe
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
    
    // Load everything needed for expiry calculation
    this.memberService.getMembers().subscribe(data => this.members.set(data));
    this.planService.getPlans().subscribe(data => this.plans.set(data));
    this.subscriptionService.getSubscriptions().subscribe({
      next: (data) => {
        this.subscriptions.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching data', err);
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

  onDelete(member: Member): void {
    if (confirm(`Are you sure you want to delete member: ${member.name}?`)) {
      this.memberService.deleteMember(member.id!).subscribe({
        next: () => {
          alert('Member deleted successfully!');
          this.members.update(prev => prev.filter(m => m.id !== member.id));
        },
        error: (err) => alert('Failed to delete member.')
      });
    }
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.memberForm.reset({ gender: 'Male', branchId: 1 });
  }

  onSubmit(): void {
    if (this.memberForm.valid) {
      const memberData = this.memberForm.value;
      
      if (this.isEditing()) {
        this.memberService.updateMember(this.editingId()!, memberData).subscribe({
          next: (updated) => {
            alert('Member updated successfully!');
            this.members.update(prev => prev.map(m => m.id === updated.id ? updated : m));
            this.cancelEdit();
          },
          error: (err) => alert('Error updating member.')
        });
      } else {
        this.memberService.addMember(memberData).subscribe({
          next: (newMember) => {
            alert('Member added successfully!');
            this.members.update(prev => [...prev, newMember]);
            this.memberForm.reset({ gender: 'Male', branchId: 1 });
          },
          error: (err) => alert('Error adding member.')
        });
      }
    }
  }
}
