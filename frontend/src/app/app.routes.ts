import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { MemberComponent } from './components/member/member';
import { PlanComponent } from './components/plan/plan';
import { SubscriptionComponent } from './components/subscription/subscription';
import { PaymentComponent } from './components/payment/payment';
import { LoginComponent } from './components/login/login';
import { authGuard, adminGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
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
