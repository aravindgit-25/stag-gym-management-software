import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MemberService } from '../../services/member.service';
import { PlanService } from '../../services/plan.service';
import { SubscriptionService } from '../../services/subscription.service';
import { Member } from '../../models/member.model';
import { Plan } from '../../models/plan.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppButtonComponent],
  templateUrl: './subscription.html',
  styleUrl: './subscription.css'
})
export class SubscriptionComponent implements OnInit {
  subscriptionForm: FormGroup;
  members = signal<Member[]>([]);
  plans = signal<Plan[]>([]);
  loading = signal<boolean>(false);

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
  }

  loadData(): void {
    this.loading.set(true);
    // Load members
    this.memberService.getMembers().subscribe({
      next: (data) => {
        console.log('Members loaded:', data);
        this.members.set(data);
      },
      error: (err) => console.error('Error loading members', err)
    });

    // Load plans
    this.planService.getPlans().subscribe({
      next: (data) => {
        console.log('Plans loaded:', data);
        this.plans.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading plans', err);
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.subscriptionForm.valid) {
      console.log('Saving subscription:', this.subscriptionForm.value);
      this.subscriptionService.addSubscription(this.subscriptionForm.value).subscribe({
        next: (res) => {
          alert('Subscription saved successfully!');
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
