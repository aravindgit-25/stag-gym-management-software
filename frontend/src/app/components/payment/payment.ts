import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, Location, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { SubscriptionService } from '../../services/subscription.service';
import { MemberService } from '../../services/member.service';
import { PaymentService } from '../../services/payment.service';
import { PlanService } from '../../services/plan.service';
import { NotificationService } from '../../services/notification.service';
import { Member } from '../../models/member.model';
import { Payment } from '../../models/payment.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';
import {
  AppStagTableComponent,
  StagTableColumn,
} from '../../shared/components/stag-table/stag-table';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, AppButtonComponent, AppStagTableComponent],
  providers: [CurrencyPipe, DatePipe],
  templateUrl: './payment.html',
  styleUrl: './payment.css',
})
export class PaymentComponent implements OnInit {
  subscriptions = signal<any[]>([]);
  members = signal<Member[]>([]);
  paymentsList = signal<Payment[]>([]);
  plans = signal<any[]>([]);
  searchTerm = signal<string>('');
  loading = signal<boolean>(false);

  private notif = inject(NotificationService);
  private router = inject(Router);
  private location = inject(Location);
  private subscriptionService = inject(SubscriptionService);
  private memberService = inject(MemberService);
  private paymentService = inject(PaymentService);
  private planService = inject(PlanService);
  private currencyPipe = inject(CurrencyPipe);
  private datePipe = inject(DatePipe);

  columns: StagTableColumn[] = [
    { field: 'regId', header: 'Reg ID', width: '100px' },
    { field: 'memberName', header: 'Member Name', minWidth: '200px' },
    { field: 'planName', header: 'Plan', width: '150px' },
    { field: 'paidAmount', header: 'Paid (₹)', width: '120px', type: 'number' },
    { field: 'balanceAmount', header: 'Balance (₹)', width: '120px', type: 'number' },
    { field: 'paymentMode', header: 'Mode', width: '120px' },
    { field: 'paymentDate', header: 'Date', width: '120px' },
    { field: 'actions', header: 'Actions', width: '80px', type: 'template' }
  ];

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading.set(true);
    forkJoin({
      payments: this.paymentService.getPayments().pipe(catchError(() => of([]))),
      members: this.memberService.getMembers().pipe(catchError(() => of([]))),
      subscriptions: this.subscriptionService.getSubscriptions().pipe(catchError(() => of([]))),
      plans: this.planService.getPlans().pipe(catchError(() => of([])))
    }).pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => {
        this.paymentsList.set(res.payments);
        this.members.set(res.members);
        this.subscriptions.set(res.subscriptions);
        this.plans.set(res.plans);
      });
  }

  displayList = computed(() => {
    const mems = this.members();
    const subs = this.subscriptions();
    const plans = this.plans();
    
    return this.paymentsList().map(pay => {
      const subId = pay.subscriptionId || (pay as any).subscription_id;
      const sub = subs.find(s => s.id === subId);
      const memberId = sub?.memberId || (sub as any)?.member_id;
      const member = mems.find(m => m.id === memberId);
      
      const planId = sub?.planId || (sub as any)?.plan_id;
      const plan = plans.find(p => p.id === planId);

      return {
        ...pay,
        regId: member?.registrationId || 'N/A',
        memberName: member?.name || 'Unknown',
        planName: plan?.name || 'N/A',
        paymentDate: pay.paymentDate ? pay.paymentDate.split('T')[0] : 'N/A'
      };
    }).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  });

  filteredPayments = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.displayList().filter(p => 
      p.memberName.toLowerCase().includes(term) || 
      p.regId.toLowerCase().includes(term) ||
      p.paymentMode.toLowerCase().includes(term)
    );
  });

  // Stats Calculations
  stats = computed(() => {
    const list = this.displayList();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const oneMonthAgo = new Date(); oneMonthAgo.setMonth(now.getMonth() - 1);
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(now.getMonth() - 6);
    const oneYearAgo = new Date(); oneYearAgo.setFullYear(now.getFullYear() - 1);

    const calc = (items: any[]) => items.reduce((sum, item) => sum + (item.paidAmount || 0), 0);

    const todayList = list.filter(p => p.paymentDate === todayStr);
    
    return {
      today: calc(todayList),
      todayCash: calc(todayList.filter(p => p.paymentMode === 'Cash')),
      todayAccount: calc(todayList.filter(p => p.paymentMode !== 'Cash')),
      
      thisMonth: calc(list.filter(p => {
        const d = new Date(p.paymentDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })),
      
      lastMonth: calc(list.filter(p => {
        const d = new Date(p.paymentDate);
        return d.getMonth() === (now.getMonth() === 0 ? 11 : now.getMonth() - 1) && 
               d.getFullYear() === (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
      })),
      
      sixMonths: calc(list.filter(p => new Date(p.paymentDate) >= sixMonthsAgo)),
      oneYear: calc(list.filter(p => new Date(p.paymentDate) >= oneYearAgo)),
      total: calc(list)
    };
  });

  onPrintReceipt(payment: any): void {
    const url = this.router.serializeUrl(this.router.createUrlTree(['/invoice', payment.id]));
    window.open(url, '_blank');
  }

  exportToPDF() {
    const data = this.filteredPayments();
    const stats = this.stats();
    const today = new Date().toLocaleDateString();

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let tableHtml = `
      <html>
      <head>
        <title>Collection Report - ${today}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; }
          .stat-box { display: flex; flex-direction: column; }
          .stat-label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold; }
          .stat-value { font-size: 20px; font-weight: bold; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e2e8f0; padding: 12px 8px; text-align: left; font-size: 13px; }
          th { background: #f1f5f9; font-weight: bold; }
          .footer { margin-top: 40px; text-align: right; font-size: 12px; color: #64748b; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>STAG FITNESS</h1>
          <h2>Collection Report - ${today}</h2>
        </div>
        
        <div class="summary">
          <div class="stat-box">
            <span class="stat-label">Total Collection</span>
            <span class="stat-value">₹${this.currencyPipe.transform(stats.today, 'INR', '', '1.0-0')}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Cash Payments</span>
            <span class="stat-value">₹${this.currencyPipe.transform(stats.todayCash, 'INR', '', '1.0-0')}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Online/Account</span>
            <span class="stat-value">₹${this.currencyPipe.transform(stats.todayAccount, 'INR', '', '1.0-0')}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Reg ID</th>
              <th>Member Name</th>
              <th>Plan</th>
              <th>Mode</th>
              <th>Paid Amt</th>
              <th>Balance</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(p => `
              <tr>
                <td>${p.regId}</td>
                <td>${p.memberName}</td>
                <td>${p.planName}</td>
                <td>${p.paymentMode}</td>
                <td>₹${p.paidAmount}</td>
                <td>₹${p.balanceAmount}</td>
                <td>${p.paymentDate}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Report Generated on ${new Date().toLocaleString()}
        </div>
        
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(tableHtml);
    printWindow.document.close();
  }

  goBack(): void {
    this.location.back();
  }
}
