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
          const mainSub = subs.find(s => s.id === Number(payment.subscriptionId));
          if (mainSub) {
            this.memberService.getMembers().subscribe(members => {
              const member = members.find(m => m.id === Number(mainSub.memberId));
              this.planService.getPlans().subscribe(allPlans => {
                
                // Heuristic: Find all subscriptions for this member on the same start date
                // that might belong to this payment.
                const startDate = mainSub.startDate || (mainSub as any).start_date;
                const mId = mainSub.memberId || (mainSub as any).member_id;

                const relatedSubs = subs.filter(s => 
                  Number(s.memberId || (s as any).member_id) === Number(mId) &&
                  (s.startDate || (s as any).start_date) === startDate
                );

                // Get plans for these subscriptions
                const selectedPlans: any[] = [];
                let currentTotal = 0;
                const targetTotal = payment.amount;

                // Sort by ID to keep order consistent
                relatedSubs.sort((a, b) => (a.id || 0) - (b.id || 0));

                for (const rs of relatedSubs) {
                  const pId = rs.planId || (rs as any).plan_id;
                  const plan = allPlans.find(p => p.id === Number(pId));
                  if (plan) {
                    // Only add if it doesn't exceed the total paid (safety check)
                    if (currentTotal + plan.price <= targetTotal || selectedPlans.length === 0) {
                      selectedPlans.push(plan);
                      currentTotal += plan.price;
                    }
                  }
                }
                
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
                  amountPaid: payment.paidAmount || payment.amount,
                  totalAmount: payment.amount,
                  balance: payment.balanceAmount || 0,
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
