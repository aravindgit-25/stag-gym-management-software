export enum UserRole {
  OWNER = 'OWNER',
  TRAINER = 'TRAINER'
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  branchId?: number;
  token?: string;
}

export interface AuthResponse {
  id: number;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  branchId?: number;
  token: string;
}
