export interface Payment {
  id?: number;
  subscriptionId: number;
  amount: number; // Total amount (Plan Price before discount)
  discountAmount: number; // Discount given
  discountReason?: string; // e.g., Referral, Festival Offer, etc.
  paidAmount: number; // Amount paid now
  balanceAmount: number; // Auto-calculated (Amount - Discount - Paid)
  balanceDueDate?: string; // If balance > 0
  paymentMode: string;
  paymentDate?: string;
}
