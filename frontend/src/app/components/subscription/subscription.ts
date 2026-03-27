import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MemberService } from '../../services/member.service';
import { PlanService } from '../../services/plan.service';
import { SubscriptionService } from '../../services/subscription.service';
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
  members = signal<Member[]>([]);
  plans = signal<Plan[]>([]);
  subscriptionsList = signal<Subscription[]>([]);
  loading = signal<boolean>(false);

  // Computed signal to join IDs with Names for the table display
  displayList = computed(() => {
    return this.subscriptionsList().map(sub => ({
      ...sub,
      memberName: this.members().find(m => m.id === Number(sub.memberId))?.name || `Member ${sub.memberId}`,
      planName: this.plans().find(p => p.id === Number(sub.planId))?.name || `Plan ${sub.planId}`
    }));
  });

  columns: TableColumn[] = [
    { field: 'id', header: 'ID' },
    { field: 'memberName', header: 'Member Name' },
    { field: 'planName', header: 'Plan Name' },
    { field: 'startDate', header: 'Start Date' }
  ];

  constructor(
    private fb: FormBuilder,
    private memberService: MemberService,
    private planService: PlanService,
    private subscriptionService: SubscriptionService
  ) {
    this.subscriptionForm = this.fb.group({
      memberId: ['', Validators.required],
      planId: ['', Validators.required],
      startDate: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.loadSubscriptions();
  }

  loadData(): void {
    this.memberService.getMembers().subscribe({
      next: (data) => this.members.set(data),
      error: (err) => console.error('Error loading members', err)
    });

    this.planService.getPlans().subscribe({
      next: (data) => this.plans.set(data),
      error: (err) => console.error('Error loading plans', err)
    });
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

  onSubmit(): void {
    if (this.subscriptionForm.valid) {
      this.subscriptionService.addSubscription(this.subscriptionForm.value).subscribe({
        next: (newSub) => {
          alert('Subscription saved successfully!');
          this.subscriptionsList.update(prev => [...prev, newSub]);
          this.subscriptionForm.reset({
            startDate: new Date().toISOString().split('T')[0]
          });
        },
        error: (err) => {
          console.error('Error saving subscription', err);
          alert('Failed to save subscription.');
        }
      });
    }
  }
}
