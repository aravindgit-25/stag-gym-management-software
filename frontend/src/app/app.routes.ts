import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { MemberComponent } from './components/member/member';
import { PlanComponent } from './components/plan/plan';
import { SubscriptionComponent } from './components/subscription/subscription';
import { PaymentComponent } from './components/payment/payment';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'members', component: MemberComponent },
  { path: 'plans', component: PlanComponent },
  { path: 'subscriptions', component: SubscriptionComponent },
  { path: 'payments', component: PaymentComponent },
  { path: '**', redirectTo: 'dashboard' }
];
