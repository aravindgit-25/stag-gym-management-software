export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TERMINATED = 'TERMINATED',
  ON_LEAVE = 'ON_LEAVE'
}

export enum EmployeeRole {
  TRAINER = 'TRAINER',
  ADMIN = 'ADMIN',
  CLEANER = 'CLEANER',
  SERVICE_STAFF = 'SERVICE_STAFF',
  MANAGER = 'MANAGER',
  OWNER = 'OWNER'
}

export interface Employee {
  id?: number;
  employeeId?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  education: string;
  experience: string;
  aadharNumber: string;
  panNumber: string;
  idProofType: string;
  idProofNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  baseSalary: number;
  bankName: string;
  bankAccountNumber: string;
  ifscCode: string;
  dateOfJoining: string;
  dateOfTermination?: string;
  status: EmployeeStatus;
  role: EmployeeRole;
}
