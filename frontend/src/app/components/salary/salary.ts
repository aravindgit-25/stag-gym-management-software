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

  private salaryService = inject(SalaryService);
  private employeeService = inject(EmployeeService);
  private notif = inject(NotificationService);
  private location = inject(Location);

  tableColumns: StagTableColumn[] = [
    { field: 'employeeName', header: 'Employee', minWidth: '150px' },
    { field: 'monthYear', header: 'Month', width: '120px' },
    { field: 'baseSalary', header: 'Base', width: '100px', type: 'number' },
    { field: 'deductions', header: 'Deductions', width: '100px', type: 'number' },
    { field: 'netSalary', header: 'Net Payable', width: '120px', type: 'number' },
    { field: 'status', header: 'Status', width: '100px' },
    { field: 'actions', header: 'Actions', width: '100px', type: 'template' }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    const monthYear = `${this.getMonthLabel(this.selectedMonth())} ${this.selectedYear()}`;
    
    forkJoin({
      employees: this.employeeService.getActiveEmployees().pipe(catchError(() => of([]))),
      salaries: this.salaryService.getSalariesByMonth(monthYear).pipe(catchError(() => of([])))
    }).pipe(finalize(() => this.loading.set(false)))
      .subscribe((res) => {
        this.activeEmployees.set(res.employees);
        this.salaries.set(res.salaries);
      });
  }

  getMonthLabel(month: number): string {
    return this.months.find(m => m.value === month)?.label || '';
  }

  calculateAll() {
    this.loading.set(true);
    const employees = this.activeEmployees();
    const month = this.selectedMonth();
    const year = this.selectedYear();

    const requests = employees.map(emp => 
      this.salaryService.calculateSalary(emp.id!, month, year).pipe(catchError(() => of(null)))
    );

    forkJoin(requests).pipe(finalize(() => {
      this.loading.set(false);
      this.loadData();
    })).subscribe(() => {
      this.notif.show('Salary calculation completed for all employees.', 'success');
    });
  }

  openPayModal(salary: Salary) {
    this.selectedSalary.set(salary);
    this.paymentMethod.set('CASH');
    this.showPayModal.set(true);
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
    return this.salaries().map(s => ({
      ...s,
      employeeName: s.employee?.name || 'Unknown',
      rowClass: s.status === SalaryStatus.PAID ? 'status-paid' : 'status-pending'
    }));
  });

  totalPayout = computed(() => {
    return this.salaries().reduce((sum, s) => sum + s.netSalary, 0);
  });
}
