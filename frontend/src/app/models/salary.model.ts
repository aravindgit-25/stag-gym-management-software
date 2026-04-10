import { Employee } from './employee.model';

export enum SalaryStatus {
  PENDING = 'PENDING',
  PAID = 'PAID'
}

export interface Salary {
  id?: number;
  employee?: Employee;
  employeeId: number;
  monthYear: string;
  baseSalary: number;
  daysPresent: number;
  daysAbsent: number;
  daysLate: number;
  deductions: number;
  bonus: number;
  netSalary: number;
  status: SalaryStatus;
  paidDate?: string;
  paymentMethod?: string;
}

export interface AttendanceSummary {
  employeeId: number;
  employeeName: string;
  month: number;
  year: number;
  daysPresent: number;
  daysAbsent: number;
  daysLate: number;
}
