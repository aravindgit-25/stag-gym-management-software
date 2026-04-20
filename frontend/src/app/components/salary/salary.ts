import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { SalaryService } from '../../services/salary.service';
import { EmployeeService } from '../../services/employee.service';
import { NotificationService } from '../../services/notification.service';
import { Salary, SalaryStatus } from '../../models/salary.model';
import { Employee } from '../../models/employee.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';
import {
  AppStagTableComponent,
  StagTableColumn,
} from '../../shared/components/stag-table/stag-table';
import { AppModalComponent } from '../../shared/components/app-modal/app-modal';

@Component({
  selector: 'app-salary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppButtonComponent,
    AppStagTableComponent,
    AppModalComponent,
  ],
  templateUrl: './salary.html',
  styleUrl: './salary.css',
})
export class SalaryComponent implements OnInit {
  salaries = signal<Salary[]>([]);
  activeEmployees = signal<Employee[]>([]);
  loading = signal<boolean>(false);
  
  // Default to current month/year
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(new Date().getFullYear());
  
  showPayModal = signal<boolean>(false);
  showDetailsModal = signal<boolean>(false);
  selectedSalary = signal<Salary | null>(null);
  paymentMethod = signal<string>('CASH');

  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  years = [2024, 2025, 2026, 2027];
  starArray = [1, 2, 3, 4, 5];

  private salaryService = inject(SalaryService);
  private employeeService = inject(EmployeeService);
  private notif = inject(NotificationService);
  private location = inject(Location);

  tableColumns: StagTableColumn[] = [
    { field: 'employeeName', header: 'Employee', minWidth: '150px' },
    { field: 'role', header: 'Role', width: '120px' },
    { field: 'baseSalary', header: 'Base', width: '100px', type: 'number' },
    { field: 'daysPresent', header: 'Present', width: '80px' },
    { field: 'tillNowSalary', header: 'Till Now', width: '110px', type: 'number' },
    { field: 'netSalary', header: 'Net Payable', width: '120px', type: 'number' },
    { field: 'status', header: 'Status', width: '100px' },
    { field: 'actions', header: 'Actions', width: '150px', type: 'template' }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    // Standard format MM-YYYY
    const monthStr = this.selectedMonth().toString().padStart(2, '0');
    const monthYear = `${monthStr}-${this.selectedYear()}`;
    
    // Also try the label format for backward compatibility if needed
    const monthLabel = `${this.getMonthLabel(this.selectedMonth())} ${this.selectedYear()}`;

    this.employeeService.getActiveEmployees().pipe(
      catchError(() => of([])),
      finalize(() => this.loading.set(false))
    ).subscribe((employees) => {
      this.activeEmployees.set(employees);
      
      // Try fetching by label first, then by code if empty
      this.salaryService.getSalariesByMonth(monthLabel).subscribe(data => {
        if (data && data.length > 0) {
          this.salaries.set(data);
        } else {
          // Fallback to MM-YYYY
          this.salaryService.getSalariesByMonth(monthYear).subscribe(data2 => {
            this.salaries.set(data2 || []);
          });
        }
      });
    });
  }

  getMonthLabel(month: number): string {
    return this.months.find(m => m.value === month)?.label || '';
  }

  calculateAll() {
    const employees = this.activeEmployees();
    if (employees.length === 0) {
      this.notif.show('No active employees found. Please load employees first.', 'error');
      return;
    }

    this.loading.set(true);
    const month = this.selectedMonth();
    const year = this.selectedYear();

    console.log(`Starting bulk calculation for ${employees.length} employees for ${month}/${year}`);

    const requests = employees.map(emp => 
      this.salaryService.calculateSalary(emp.id!, month, year).pipe(
        catchError(err => {
          console.error(`Calculation failed for ${emp.name}:`, err);
          return of(null);
        })
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        const successCount = results.filter(r => r !== null).length;
        console.log(`Bulk calculation finished. Success: ${successCount}/${employees.length}`);
        
        if (successCount > 0) {
          this.notif.show(`Calculation complete for ${successCount} employees.`, 'success');
        } else {
          this.notif.show('Calculation failed. Ensure attendance is marked for this period.', 'error');
        }
        this.loadData();
      },
      error: (err) => {
        console.error('Critical error during bulk calculation:', err);
        this.notif.show('Error during calculation.', 'error');
        this.loading.set(false);
      }
    });
  }

  openPayModal(salary: Salary) {
    const employees = this.activeEmployees();
    const emp = employees.find(e => e.id === salary.employeeId) || salary.employee;
    
    this.selectedSalary.set({
      ...salary,
      employeeName: emp?.name || 'Unknown'
    });
    this.paymentMethod.set('CASH');
    this.showPayModal.set(true);
  }

  openDetailsModal(salary: Salary) {
    const employees = this.activeEmployees();
    const emp = employees.find(e => e.id === salary.employeeId) || salary.employee;
    
    const daysInMonth = new Date(this.selectedYear(), this.selectedMonth(), 0).getDate();
    const fallbackTillNow = Math.round((salary.baseSalary / daysInMonth) * salary.daysPresent);
    const tillNowSalary = salary.till_now_salary || salary.tillNowSalary || fallbackTillNow;

    this.loading.set(true);
    this.employeeService.getEmployeeProfile(salary.employeeId).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (fullProfile) => {
        this.selectedSalary.set({
          ...salary,
          employeeName: fullProfile.name,
          employee: fullProfile,
          tillNowSalary: tillNowSalary
        });
        this.showDetailsModal.set(true);
      },
      error: (err) => {
        this.selectedSalary.set({
          ...salary,
          employeeName: emp?.name || 'Unknown',
          employee: emp,
          tillNowSalary: tillNowSalary
        });
        this.showDetailsModal.set(true);
        this.notif.show('Some employee details could not be loaded.', 'error');
      }
    });
  }

  onPay() {
    if (this.selectedSalary()?.id) {
      this.salaryService.paySalary(this.selectedSalary()!.id!, this.paymentMethod()).subscribe({
        next: () => {
          this.notif.show('Salary payment recorded.', 'success');
          this.loadData();
          this.showPayModal.set(false);
        },
        error: () => this.notif.show('Error recording payment.', 'error')
      });
    }
  }

  goBack(): void {
    this.location.back();
  }

  salaryData = computed(() => {
    const employees = this.activeEmployees();
    const today = new Date();
    const daysInMonth = new Date(this.selectedYear(), this.selectedMonth(), 0).getDate();
    
    return this.salaries().map(s => {
      // Find employee by numeric ID
      const emp = employees.find(e => e.id === s.employeeId) || s.employee;
      
      // Calculate Salary Till Now (Fallback if backend doesn't provide it)
      const fallbackTillNow = Math.round((s.baseSalary / daysInMonth) * s.daysPresent);
      const tillNowSalary = s.till_now_salary || s.tillNowSalary || fallbackTillNow;
      
      return {
        ...s,
        employeeName: emp?.name || 'Unknown',
        employeeCode: emp?.employeeId || 'N/A',
        role: emp?.role || 'N/A',
        tillNowSalary: tillNowSalary,
        absentDates: s.absent_dates || s.absentDates || [],
        rowClass: s.status === SalaryStatus.PAID ? 'status-paid' : 'status-pending'
      };
    });
  });

  totalPayout = computed(() => {
    return this.salaries().reduce((sum, s) => sum + s.netSalary, 0);
  });
}
