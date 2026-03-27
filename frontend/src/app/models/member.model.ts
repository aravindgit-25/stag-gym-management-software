export interface Member {
  id?: number;
  name: string;
  phone: string;
  gender: string;
  branchId: number;
  expiryDate?: string; // Format: YYYY-MM-DD
}
