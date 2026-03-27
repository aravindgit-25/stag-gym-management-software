import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubscriptionService } from '../../services/subscription.service';
import { PaymentService } from '../../services/payment.service';
import { Subscription } from '../../models/subscription.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppButtonComponent],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class PaymentComponent implements OnInit {
  paymentForm: FormGroup;
  subscriptions = signal<any[]>([]); // Using any to handle joined data if returned
  loading = signal<boolean>(false);

  paymentModes = ['Cash', 'UPI', 'Card', 'Bank Transfer'];

  constructor(
    private fb: FormBuilder,
    private subscriptionService: SubscriptionService,
    private paymentService: PaymentService
  ) {
    this.paymentForm = this.fb.group({
      subscriptionId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      paymentMode: ['Cash', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.loading.set(true);
    this.subscriptionService.getSubscriptions().subscribe({
      next: (data) => {
        this.subscriptions.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading subscriptions', err);
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.paymentForm.valid) {
      this.paymentService.addPayment(this.paymentForm.value).subscribe({
        next: (res) => {
          alert('Payment recorded successfully!');
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
