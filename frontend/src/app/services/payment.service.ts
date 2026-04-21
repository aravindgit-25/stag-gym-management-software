import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Payment } from '../models/payment.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/payments`;

  private getBranchParams(): HttpParams {
    let params = new HttpParams();
    const branchId = this.auth.getBranchId();
    if (branchId) {
      params = params.set('branchId', branchId.toString());
    }
    return params;
  }

  addPayment(payment: Payment): Observable<Payment> {
    const branchId = this.auth.getBranchId();
    const payload = { ...payment, branchId: branchId || (payment as any).branchId };
    return this.http.post<Payment>(this.apiUrl, payload);
  }

  getPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(this.apiUrl, { params: this.getBranchParams() }).pipe(
      catchError(() => of([]))
    );
  }
}
