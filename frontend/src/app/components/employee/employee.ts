import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { EmployeeService } from '../../services/employee.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';
import { Employee, EmployeeStatus, EmployeeRole } from '../../models/employee.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';
import {
  AppStagTableComponent,
  StagTableColumn,
} from '../../shared/components/stag-table/stag-table';
import { AppModalComponent } from '../../shared/components/app-modal/app-modal';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AppButtonComponent,
    AppStagTableComponent,
    AppModalComponent,
  ],
  templateUrl: './employee.html',
  styleUrl: './employee.css',
})
export class EmployeeComponent implements OnInit {
  employeeForm: FormGroup;
  employees = signal<Employee[]>([]);
  searchTerm = signal<string>('');
  loading = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);
  showModal = signal<boolean>(false);
  activeTab = signal<'active' | 'archive'>('active');

  roles = Object.values(EmployeeRole);
  statuses = Object.values(EmployeeStatus);

  private notif = inject(NotificationService);
  private confirm = inject(ConfirmService);
  private employeeService = inject(EmployeeService);
  private location = inject(Location);

  tableColumns = computed<StagTableColumn[]>(() => [
    { field: 'employeeId', header: 'Emp ID', width: '120px' },
    { field: 'name', header: 'Name', minWidth: '150px' },
    { field: 'phone', header: 'Phone', width: '130px' },
    { field: 'role', header: 'Role', width: '130px' },
    { field: 'status', header: 'Status', width: '120px' },
    { field: 'dateOfJoining', header: 'Joined', width: '120px' },
  ]);

  constructor(private fb: FormBuilder) {
    this.employeeForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      education: [''],
      experience: [''],
      aadharNumber: ['', Validators.required],
      panNumber: ['', Validators.required],
      idProofType: ['Aadhar', Validators.required],
      idProofNumber: ['', Validators.required],
      emergencyContactName: ['', Validators.required],
      emergencyContactPhone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      emergencyContactRelation: ['', Validators.required],
      baseSalary: [0, [Validators.required, Validators.min(0)]],
      bankName: ['', Validators.required],
      bankAccountNumber: ['', Validators.required],
      ifscCode: ['', Validators.required],
      dateOfJoining: [new Date().toISOString().split('T')[0], Validators.required],
      status: [EmployeeStatus.ACTIVE, Validators.required],
      role: [EmployeeRole.TRAINER, Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading.set(true);
    const obs = this.activeTab() === 'active' 
      ? this.employeeService.getActiveEmployees() 
      : this.employeeService.getEmployees();

    obs.pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          if (this.activeTab() === 'archive') {
            this.employees.set(data.filter(e => e.status === EmployeeStatus.TERMINATED));
          } else {
            this.employees.set(data);
          }
        },
        error: (err) => this.notif.show('Error fetching employees.', 'error'),
      });
  }

  setTab(tab: 'active' | 'archive') {
    this.activeTab.set(tab);
    this.loadEmployees();
  }

  openAddModal() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.employeeForm.reset({
      dateOfJoining: new Date().toISOString().split('T')[0],
      status: EmployeeStatus.ACTIVE,
      role: EmployeeRole.TRAINER,
      baseSalary: 0,
      idProofType: 'Aadhar'
    });
    this.showModal.set(true);
  }

  onEdit(employee: Employee): void {
    this.isEditing.set(true);
    this.editingId.set(employee.id || null);
    this.employeeForm.patchValue(employee);
    this.showModal.set(true);
  }

  async onTerminate(employee: Employee) {
    const confirmed = await this.confirm.ask(
      `Are you sure you want to terminate ${employee.name}? This action is irreversible.`,
    );
    if (confirmed) {
      this.employeeService.terminateEmployee(employee.id!).subscribe({
        next: () => {
          this.notif.show('Employee terminated successfully.', 'success');
          this.loadEmployees();
        },
        error: (err) => this.notif.show('Failed to terminate employee.', 'error'),
      });
    }
  }

  onSubmit() {
    if (this.employeeForm.valid) {
      const data = this.employeeForm.value;
      if (this.isEditing()) {
        this.employeeService.updateEmployee(this.editingId()!, data).subscribe({
          next: () => {
            this.notif.show('Employee updated successfully!', 'success');
            this.loadEmployees();
            this.showModal.set(false);
          },
          error: (err) => this.notif.show('Error updating employee.', 'error'),
        });
      } else {
        this.employeeService.addEmployee(data).subscribe({
          next: () => {
            this.notif.show('Employee added successfully!', 'success');
            this.loadEmployees();
            this.showModal.set(false);
          },
          error: (err) => this.notif.show('Error adding employee.', 'error'),
        });
      }
    }
  }

  closeModal() {
    this.showModal.set(false);
  }

  goBack(): void {
    this.location.back();
  }

  filteredEmployees = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.employees().filter(
      (e) => e.name.toLowerCase().includes(term) || e.employeeId?.toLowerCase().includes(term) || e.phone.includes(term)
    );
  });
}
