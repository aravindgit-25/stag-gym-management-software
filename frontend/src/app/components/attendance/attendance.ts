import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
} from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AttendanceService } from '../../services/attendance.service';
import { EmployeeService } from '../../services/employee.service';
import { NotificationService } from '../../services/notification.service';
import { Attendance, AttendanceStatus } from '../../models/attendance.model';
import { Employee } from '../../models/employee.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';
import {
  AppStagTableComponent,
  StagTableColumn,
} from '../../shared/components/stag-table/stag-table';
import { AppModalComponent } from '../../shared/components/app-modal/app-modal';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AppButtonComponent,
    AppStagTableComponent,
    AppModalComponent,
  ],
  templateUrl: './attendance.html',
  styleUrl: './attendance.css',
})
export class AttendanceComponent implements OnInit {
  attendanceRecords = signal<Attendance[]>([]);
  activeEmployees = signal<Employee[]>([]);
  loading = signal<boolean>(false);
  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);
  
  showMarkModal = signal<boolean>(false);
  markForm: FormGroup;
  selectedEmployee = signal<Employee | null>(null);

  attendanceStatuses = Object.values(AttendanceStatus);

  private attendanceService = inject(AttendanceService);
  private employeeService = inject(EmployeeService);
  private notif = inject(NotificationService);
  private location = inject(Location);
  private fb = inject(FormBuilder);

  tableColumns: StagTableColumn[] = [
    { field: 'employeeName', header: 'Employee', minWidth: '150px' },
    { field: 'role', header: 'Role', width: '120px' },
    { field: 'status', header: 'Status', width: '120px' },
    { field: 'checkInTime', header: 'In', width: '100px' },
    { field: 'checkOutTime', header: 'Out', width: '100px' },
    { field: 'notes', header: 'Notes', minWidth: '150px' },
  ];

  constructor() {
    this.markForm = this.fb.group({
      status: [AttendanceStatus.PRESENT, Validators.required],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    forkJoin({
      employees: this.employeeService.getActiveEmployees().pipe(catchError(() => of([]))),
      attendance: this.attendanceService.getDailyAttendance(this.selectedDate()).pipe(catchError(() => of([])))
    }).pipe(finalize(() => this.loading.set(false)))
      .subscribe((res) => {
        this.activeEmployees.set(res.employees);
        this.attendanceRecords.set(res.attendance);
      });
  }

  loadAttendance() {
    this.loading.set(true);
    this.attendanceService.getDailyAttendance(this.selectedDate())
      .pipe(
        catchError(() => of([])),
        finalize(() => this.loading.set(false))
      )
      .subscribe((data) => {
        this.attendanceRecords.set(data);
      });
  }

  openMarkModal(employee: Employee) {
    this.selectedEmployee.set(employee);
    this.markForm.reset({ status: AttendanceStatus.PRESENT });
    this.showMarkModal.set(true);
  }

  onMark() {
    if (this.markForm.valid && this.selectedEmployee()) {
      const { status, notes } = this.markForm.value;
      this.attendanceService.markAttendance(this.selectedEmployee()!.employeeId!, status, notes).subscribe({
        next: () => {
          this.notif.show('Attendance marked.', 'success');
          this.loadAttendance();
          this.showMarkModal.set(false);
        },
        error: () => this.notif.show('Error marking attendance.', 'error')
      });
    }
  }

  onCheckout(attendance: Attendance) {
    if (!attendance.employee?.employeeId) return;
    this.attendanceService.checkoutAttendance(attendance.employee.employeeId).subscribe({
      next: () => {
        this.notif.show('Checkout successful.', 'success');
        this.loadAttendance();
      },
      error: () => this.notif.show('Error during checkout.', 'error')
    });
  }

  goBack(): void {
    this.location.back();
  }

  attendanceData = computed(() => {
    return this.attendanceRecords().map(r => ({
      ...r,
      employeeName: r.employee?.name || 'Unknown',
      role: r.employee?.role || 'N/A',
      rowClass: this.getStatusClass(r.status)
    }));
  });

  // Helper to see who hasn't marked attendance yet
  missingAttendance = computed(() => {
    const presentIds = this.attendanceRecords()
      .filter(r => r.employee)
      .map(r => r.employee.id);
    return this.activeEmployees().filter(e => !presentIds.includes(e.id));
  });

  getStatusClass(status: AttendanceStatus): string {
    switch (status) {
      case AttendanceStatus.PRESENT: return 'status-present';
      case AttendanceStatus.LATE: return 'status-late';
      case AttendanceStatus.ABSENT: return 'status-absent';
      case AttendanceStatus.HALF_DAY: return 'status-half';
      default: return '';
    }
  }
}
