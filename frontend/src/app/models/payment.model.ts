export interface Payment {
  id?: number;
  subscriptionId: number;
  amount: number;
  paymentMode: string;
  paymentDate?: string;
}
