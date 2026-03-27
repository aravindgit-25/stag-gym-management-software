export interface Member {
  id?: number;
  registrationId?: string; // e.g., SG-001
  name: string;
  phone: string;
  gender: string;
  branchId: number;
  expiryDate?: string;
}
