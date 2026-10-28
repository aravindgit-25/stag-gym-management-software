export interface PTMember {
  id: number;
  memberId: number;
  memberName: string;
  memberPhone?: string;
  trainerId: number;
  trainerName: string;
  planId: number;
  planName: string;
  totalSessions: number;
  sessionsRemaining: number;
  expiryDate: string;
  startDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'COMPLETED';
}

export interface PTSessionLog {
  id?: number;
  ptMemberId: number;
  date: string;
  trainerId: number;
  trainerName?: string;
  trainerVerification: boolean;
  clientVerification: boolean;
  notes?: string;
  sessionsRemainingAfter?: number;
}
