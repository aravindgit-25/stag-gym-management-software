export interface Payment {
  id?: number;
  subscriptionId: number;
  amount: number; // Total amount (Plan Price)
  paidAmount: number; // Amount paid now
  balanceAmount: number; // Auto-calculated
  balanceDueDate?: string; // If balance > 0
  paymentMode: string;
  paymentDate?: string;
}
