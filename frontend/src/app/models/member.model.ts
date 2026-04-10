export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING'
}

export interface Member {
  id?: number;
  registrationId?: string;
  name: string;
  phone: string;
  email?: string;
  gender: Gender;
  dob?: string;
  address?: string;
  bloodGroup?: string;
  
  // Physical Info
  weight?: number;
  height?: number;
  fitnessGoal?: string;
  
  // Emergency Info
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  
  // Registration Info
  joiningDate: string;
  expiryDate?: string;
  idProofType?: string;
  idProofNumber?: string;
  status: MemberStatus;
  
  // Plan Info (Nested for UI convenience)
  currentPlanId?: number;
  currentPlanName?: string;
  lastPaymentDate?: string;
  totalPaid?: number;
}
