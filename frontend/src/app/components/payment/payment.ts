import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { SubscriptionService } from '../../services/subscription.service';
import { MemberService } from '../../services/member.service';
import { PaymentService } from '../../services/payment.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';
import { Member } from '../../models/member.model';
import { Payment } from '../../models/payment.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';
import { AppStagTableComponent, StagTableColumn } from '../../shared/components/stag-table/stag-table';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, AppButtonComponent, AppStagTableComponent],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class PaymentComponent implements OnInit {
  subscriptions = signal<any[]>([]); 
  members = signal<Member[]>([]);
  paymentsList = signal<Payment[]>([]);
  loading = signal<boolean>(false);

  private notif = inject(NotificationService);
  private router = inject(Router);
  private location = inject(Location);

  // Join data to show Member Name instead of Subscription ID
  displayList = computed(() => {
    const subs = this.subscriptions();
    const mems = this.members();
    const payments = this.paymentsList();

    return payments.map(pay => {
      // Handle both camelCase and snake_case for subscriptionId
      const subId = pay.subscriptionId || (pay as any).subscription_id;
      const sub = subs.find(s => Number(s.id) === Number(subId));
      
      // Handle both camelCase and snake_case for memberId
      const memberId = sub?.memberId || (sub as any)?.member_id;
      const member = mems.find(m => Number(m.id) === Number(memberId));
      
      return {
        ...pay,
        memberName: member?.name || (subId ? `Sub ${subId}` : 'N/A'),
        paymentDate: pay.paymentDate ? pay.paymentDate.split('T')[0] : 'N/A'
      };
    }).sort((a, b) => Number(b.id) - Number(a.id)); // Show latest payments first
  });

  columns: StagTableColumn[] = [
    { field: 'id', header: 'ID', width: '80px' },
    { field: 'memberName', header: 'Member Name' },
    { field: 'amount', header: 'Amount (₹)', width: '150px' },
    { field: 'paymentMode', header: 'Mode', width: '150px' },
    { field: 'paymentDate', header: 'Date', width: '150px' }
  ];

  constructor(
    private subscriptionService: SubscriptionService,
    private memberService: MemberService,
    private paymentService: PaymentService
  ) {}

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
        this.notif.show('Error loading payments', 'error');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  onPrintReceipt(payment: any): void {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/invoice', payment.id])
    );
    window.open(url, '_blank');
  }
}
