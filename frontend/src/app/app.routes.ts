import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { MemberComponent } from './components/member/member';
import { LeadComponent } from './components/lead/lead';
import { EmployeeComponent } from './components/employee/employee';
import { AttendanceComponent } from './components/attendance/attendance';
import { PlanComponent } from './components/plan/plan';
import { SubscriptionComponent } from './components/subscription/subscription';
import { PaymentComponent } from './components/payment/payment';
import { LoginComponent } from './components/login/login';
import { InvoiceComponent } from './components/invoice/invoice';
import { authGuard, adminGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'invoice/:id', component: InvoiceComponent },
  { 
    path: '', 
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        component: DashboardComponent,
        canActivate: [adminGuard] 
      },
      { path: 'members', component: MemberComponent },
      { path: 'leads', component: LeadComponent },
      { path: 'staff', component: EmployeeComponent },
      { path: 'attendance', component: AttendanceComponent },
      { path: 'plans', component: PlanComponent },
      { path: 'subscriptions', component: SubscriptionComponent },
      { 
        path: 'payments', 
        component: PaymentComponent,
        canActivate: [adminGuard]
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
