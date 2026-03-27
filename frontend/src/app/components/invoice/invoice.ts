import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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

  ngOnInit(): void {
    const paymentId = this.route.snapshot.params['id'];
    this.loadInvoiceData(paymentId);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  }

  loadInvoiceData(paymentId: string) {
    this.paymentService.getPayments().subscribe(payments => {
      const payment = payments.find(p => p.id === Number(paymentId));
      if (payment) {
        this.subService.getSubscriptions().subscribe(subs => {
          const sub = subs.find(s => s.id === Number(payment.subscriptionId));
          if (sub) {
            this.memberService.getMembers().subscribe(members => {
              const member = members.find(m => m.id === Number(sub.memberId));
              this.planService.getPlans().subscribe(plans => {
                const plan = plans.find(p => p.id === Number(sub.planId));
                
                const expDate = new Date(sub.startDate || (sub as any).start_date);
                expDate.setDate(expDate.getDate() + (plan?.duration || 0));

                this.invoiceData.set({
                  receiptNo: `REC-${payment.id?.toString().padStart(4, '0')}`,
                  regId: member?.registrationId || `SG-${member?.id?.toString().padStart(3, '0')}`,
                  memberName: member?.name,
                  phone: member?.phone,
                  planName: plan?.name,
                  planPrice: plan?.price || 0,
                  startDate: this.formatDate(sub.startDate || (sub as any).start_date),
                  endDate: expDate.toISOString().split('T')[0],
                  amountPaid: payment.amount,
                  balance: (plan?.price || 0) - payment.amount,
                  paymentMode: payment.paymentMode,
                  date: this.formatDate(payment.paymentDate || new Date().toISOString())
                });

                // Trigger print dialog
                setTimeout(() => window.print(), 1000);
              });
            });
          }
        });
      }
    });
  }
}
