import { Employee } from './employee.model';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  ON_LEAVE = 'ON_LEAVE'
}

export interface Attendance {
  id?: number;
  employee: Employee;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}
