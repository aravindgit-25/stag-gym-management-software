import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, timer, of } from 'rxjs';
import { switchMap, retry, catchError, take } from 'rxjs/operators';
import { PaymentService } from '../../services/payment.service';
import { SubscriptionService } from '../../services/subscription.service';
import { MemberService } from '../../services/member.service';
import { PlanService } from '../../services/plan.service';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice.html',
  styleUrl: './invoice.css'
})
export class InvoiceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private paymentService = inject(PaymentService);
  private subService = inject(SubscriptionService);
  private memberService = inject(MemberService);
  private planService = inject(PlanService);

  invoiceData = signal<any>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const paymentId = this.route.snapshot.params['id'];
    this.loadInvoiceData(paymentId);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  }

  loadInvoiceData(paymentId: string) {
    this.loading.set(true);
    
    // Use forkJoin to get all data at once with retries for reliability
    forkJoin({
      payments: this.paymentService.getPayments().pipe(retry(2), catchError(() => of([]))),
      subs: this.subService.getSubscriptions().pipe(retry(2), catchError(() => of([]))),
      members: this.memberService.getMembers().pipe(retry(2), catchError(() => of([]))),
      plans: this.planService.getPlans().pipe(retry(2), catchError(() => of([])))
    }).subscribe({
      next: (result) => {
        const payment = result.payments.find(p => Number(p.id) === Number(paymentId));
        
        if (!payment) {
          // If not found immediately, wait 2 seconds and try one more time (case where DB write is slow)
          timer(2000).pipe(
            switchMap(() => this.paymentService.getPayments()),
            take(1)
          ).subscribe(retryPayments => {
            const retryPayment = retryPayments.find(p => Number(p.id) === Number(paymentId));
            if (retryPayment) {
              this.processData(retryPayment, result.subs, result.members, result.plans);
            } else {
              this.error.set('Invoice not found. Please check if the payment was successful.');
              this.loading.set(false);
            }
          });
          return;
        }

        this.processData(payment, result.subs, result.members, result.plans);
      },
      error: (err) => {
        this.error.set('Failed to load invoice data. Please refresh.');
        this.loading.set(false);
      }
    });
  }

  private processData(payment: any, subs: any[], members: any[], allPlans: any[]) {
    const subId = payment.subscriptionId || (payment as any).subscription_id;
    const mainSub = subs.find(s => Number(s.id) === Number(subId));
    
    if (!mainSub) {
      this.error.set('Subscription details not found for this invoice.');
      this.loading.set(false);
      return;
    }

    const mId = mainSub.memberId || (mainSub as any).member_id;
    const member = members.find(m => Number(m.id) === Number(mId));
    
    const startDate = mainSub.startDate || (mainSub as any).start_date;
    
    // Find related plans for this transaction
    const relatedSubs = subs.filter(s => 
      Number(s.memberId || (s as any).member_id) === Number(mId) &&
      (s.startDate || (s as any).start_date) === startDate
    );

    const selectedPlans: any[] = [];
    relatedSubs.forEach(rs => {
      const pId = rs.planId || (rs as any).plan_id;
      // Handle comma-separated plan IDs if they exist
      const pIds = typeof pId === 'string' ? pId.split(',').map(Number) : [Number(pId)];
      
      pIds.forEach(id => {
        const plan = allPlans.find(p => Number(p.id) === id);
        if (plan && !selectedPlans.find(sp => sp.id === plan.id)) {
          selectedPlans.push(plan);
        }
      });
    });

    const maxDuration = Math.max(...selectedPlans.map(p => p.duration || 0), 0);
    const expDate = new Date(startDate);
    expDate.setDate(expDate.getDate() + maxDuration);

    this.invoiceData.set({
      receiptNo: `REC-${payment.id?.toString().padStart(4, '0')}`,
      regId: member?.registrationId || `SG-${member?.id?.toString().padStart(3, '0')}`,
      memberName: member?.name,
      phone: member?.phone,
      plans: selectedPlans,
      startDate: this.formatDate(startDate),
      endDate: expDate.toISOString().split('T')[0],
      amountPaid: payment.paidAmount || (payment as any).paid_amount || payment.amount,
      totalAmount: payment.amount,
      balance: payment.balanceAmount || (payment as any).balance_amount || 0,
      paymentMode: payment.paymentMode || (payment as any).payment_mode,
      date: this.formatDate(payment.paymentDate || (payment as any).payment_date || new Date().toISOString())
    });

    this.loading.set(false);
    
    // Trigger print dialog
    setTimeout(() => {
      if (!this.error()) window.print();
    }, 1000);
  }
}
