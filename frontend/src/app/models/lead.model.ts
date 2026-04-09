export enum LeadStatus {
  NEW = 'NEW',
  FOLLOW_UP = 'FOLLOW_UP',
  JOINED = 'JOINED',
  NOT_INTERESTED = 'NOT_INTERESTED',
  JOINED_ELSEWHERE = 'JOINED_ELSEWHERE'
}

export interface Lead {
  id?: number;
  name: string;
  phone: string;
  location: string;
  goal: string;
  status: LeadStatus;
  planToJoinDate: string;
  nextFollowUpDate: string;
  lastFollowUpDate?: string;
  notes?: string;
}
