import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubscriptionService } from '../../services/subscription.service';
import { MemberService } from '../../services/member.service';
import { PaymentService } from '../../services/payment.service';
import { Subscription } from '../../models/subscription.model';
import { Member } from '../../models/member.model';
import { Payment } from '../../models/payment.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';
import { AppTableComponent, TableColumn } from '../../shared/components/app-table/app-table';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppButtonComponent, AppTableComponent],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class PaymentComponent implements OnInit {
  paymentForm: FormGroup;
  subscriptions = signal<any[]>([]); 
  members = signal<Member[]>([]);
  paymentsList = signal<Payment[]>([]);
  loading = signal<boolean>(false);

  paymentModes = ['Cash', 'UPI', 'Card', 'Bank Transfer'];

  // Join data to show Member Name instead of Subscription ID
  displayList = computed(() => {
    return this.paymentsList().map(pay => {
      const sub = this.subscriptions().find(s => s.id === Number(pay.subscriptionId));
      const member = this.members().find(m => m.id === Number(sub?.memberId));
      return {
        ...pay,
        memberName: member?.name || `Sub ${pay.subscriptionId}`
      };
    });
  });

  columns: TableColumn[] = [
    { field: 'id', header: 'ID' },
    { field: 'memberName', header: 'Member Name' },
    { field: 'amount', header: 'Amount (₹)' },
    { field: 'paymentMode', header: 'Mode' },
    { field: 'paymentDate', header: 'Date' }
  ];

  constructor(
    private fb: FormBuilder,
    private subscriptionService: SubscriptionService,
    private memberService: MemberService,
    private paymentService: PaymentService
  ) {
    this.paymentForm = this.fb.group({
      subscriptionId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      paymentMode: ['Cash', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.loadPayments();
  }

  loadInitialData(): void {
    this.subscriptionService.getSubscriptions().subscribe({
      next: (data) => this.subscriptions.set(data),
      error: (err) => console.error('Error loading subscriptions', err)
    });
    this.memberService.getMembers().subscribe({
      next: (data) => this.members.set(data),
      error: (err) => console.error('Error loading members', err)
    });
  }

  loadPayments(): void {
    this.loading.set(true);
    this.paymentService.getPayments().subscribe({
      next: (data) => {
        this.paymentsList.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading payments', err);
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.paymentForm.valid) {
      this.paymentService.addPayment(this.paymentForm.value).subscribe({
        next: (newPayment) => {
          alert('Payment recorded successfully!');
          this.paymentsList.update(prev => [...prev, newPayment]);
          this.paymentForm.reset({ paymentMode: 'Cash' });
        },
        error: (err) => {
          console.error('Error saving payment', err);
          alert('Failed to save payment.');
        }
      });
    }
  }
}
