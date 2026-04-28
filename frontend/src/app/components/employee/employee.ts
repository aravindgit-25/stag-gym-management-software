import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { EmployeeService } from '../../services/employee.service';
import { MemberService } from '../../services/member.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';
import { Employee, EmployeeStatus, EmployeeRole } from '../../models/employee.model';
import { Member } from '../../models/member.model';
import { Branch } from '../../models/branch.model';
import { BranchService } from '../../services/branch.service';
import { AuthService } from '../../services/auth.service';
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
  ptForm: FormGroup;
  feedbackForm: FormGroup;
  
  employees = signal<Employee[]>([]);
  activeMembers = signal<Member[]>([]);
  branches = signal<Branch[]>([]);
  
  searchTerm = signal<string>('');
  loading = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);
  
  showModal = signal<boolean>(false);
  showProfileModal = signal<boolean>(false);
  showAssignPTModal = signal<boolean>(false);
  showAddFeedbackModal = signal<boolean>(false);
  
  selectedEmployee = signal<Employee | null>(null);
  activeTab = signal<'active' | 'archive'>('active');
  activeProfileTab = signal<'info' | 'pt' | 'feedback'>('info');

  roles = Object.values(EmployeeRole);
  statuses = Object.values(EmployeeStatus);
  starArray = [1, 2, 3, 4, 5];

  private notif = inject(NotificationService);
  private confirm = inject(ConfirmService);
  private employeeService = inject(EmployeeService);
  private memberService = inject(MemberService);
  private branchService = inject(BranchService);
  public authService = inject(AuthService);
  private location = inject(Location);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  tableColumns = computed<StagTableColumn[]>(() => [
    { field: 'employeeId', header: 'Emp ID', width: '120px' },
    { field: 'name', header: 'Name', minWidth: '150px' },
    { field: 'phone', header: 'Phone', width: '130px' },
    { field: 'role', header: 'Role', width: '130px' },
    { field: 'status', header: 'Status', width: '120px' },
    { field: 'dateOfJoining', header: 'Joined', width: '120px' },
    { field: 'actions', header: 'Actions', width: '150px', type: 'template' }
  ]);

  constructor(private fb: FormBuilder) {
    // Reactive auto-reload when branch changes
    effect(() => {
      this.authService.selectedBranchId(); // Track the signal
      this.loadEmployees();
    });

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
      branchId: [null, Validators.required]
    });

    this.ptForm = this.fb.group({
      memberId: [null, Validators.required],
      goal: ['', Validators.required],
      duration: ['', Validators.required],
      startDate: [new Date().toISOString().split('T')[0], Validators.required],
      isPaid: [false]
    });

    this.feedbackForm = this.fb.group({
      clientName: ['', Validators.required],
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadMembers();
    this.loadBranches();

    this.route.queryParams.subscribe(params => {
      if (params['filter']) {
        const filter = params['filter'];
        if (filter === 'active') this.setTab('active');
        else if (filter === 'archive') this.setTab('archive');
      }
      if (params['action'] === 'add') {
        this.openAddModal();
        this.router.navigate([], { queryParams: { action: null }, queryParamsHandling: 'merge' });
      }
    });
  }

  loadEmployees(): void {
    const bId = this.authService.getBranchId();
    console.log('Loading employees for branch:', bId);
    
    this.loading.set(true);
    const obs = this.activeTab() === 'active' 
      ? this.employeeService.getActiveEmployees() 
      : this.employeeService.getEmployees();

    obs.pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          console.log('Employees received:', data.length);
          if (this.activeTab() === 'archive') {
            this.employees.set(data.filter(e => e.status === EmployeeStatus.TERMINATED));
          } else {
            this.employees.set(data);
          }
        },
        error: (err) => {
          console.error('Error fetching employees:', err);
          this.notif.show('Error fetching employees.', 'error');
        },
      });
  }

  loadMembers() {
    this.memberService.getActiveMembers().subscribe(data => this.activeMembers.set(data));
  }

  loadBranches() {
    this.branchService.getBranches().subscribe(data => this.branches.set(data));
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

  onViewProfile(employee: Employee): void {
    if (!employee.id) return;
    this.activeProfileTab.set('info'); // Reset to first tab
    this.refreshProfile(employee.id);
  }

  refreshProfile(id: number) {
    this.loading.set(true);
    // Important: Clear selection first to avoid showing old data
    this.selectedEmployee.set(null);
    
    this.employeeService.getEmployeeProfile(id).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (fullProfile) => {
        this.selectedEmployee.set(fullProfile);
        this.showProfileModal.set(true);
      },
      error: (err) => this.notif.show('Error fetching profile details.', 'error')
    });
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
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      this.notif.show('Please fill all mandatory fields correctly (*)', 'error');
      return;
    }

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

  closeModal() {
    this.showModal.set(false);
  }

  openAssignPTModal() {
    this.ptForm.reset({
      startDate: new Date().toISOString().split('T')[0],
      isPaid: false
    });
    this.showAssignPTModal.set(true);
  }

  onAssignPT() {
    if (this.ptForm.invalid) return;
    const empId = this.selectedEmployee()?.id;
    if (!empId) return;

    this.loading.set(true);
    this.employeeService.assignPTMember(empId, this.ptForm.value).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        this.notif.show('Member assigned successfully!', 'success');
        this.showAssignPTModal.set(false);
        this.refreshProfile(empId);
      },
      error: () => this.notif.show('Failed to assign member.', 'error')
    });
  }

  openAddFeedbackModal() {
    this.feedbackForm.reset({
      rating: 5,
      date: new Date().toISOString().split('T')[0]
    });
    this.showAddFeedbackModal.set(true);
  }

  onAddFeedback() {
    if (this.feedbackForm.invalid) return;
    const empId = this.selectedEmployee()?.id;
    if (!empId) return;

    this.loading.set(true);
    this.employeeService.addFeedback(empId, this.feedbackForm.value).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        this.notif.show('Feedback added successfully!', 'success');
        this.showAddFeedbackModal.set(false);
        this.refreshProfile(empId);
      },
      error: () => this.notif.show('Failed to add feedback.', 'error')
    });
  }

  goBack(): void {
    this.location.back();
  }

  filteredEmployees = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.employees()
      .filter((e) => {
        const name = (e.name || '').toLowerCase();
        const empId = (e.employeeId || '').toLowerCase();
        const phone = (e.phone || '').toLowerCase();
        return name.includes(term) || empId.includes(term) || phone.includes(term);
      })
      .map(e => ({
        ...e,
        rowClass: this.getStatusClass(e.status)
      }));
  });

  getStatusClass(status: EmployeeStatus): string {
    switch (status) {
      case EmployeeStatus.ACTIVE: return 'status-active';
      case EmployeeStatus.INACTIVE: return 'status-inactive';
      case EmployeeStatus.TERMINATED: return 'status-terminated';
      case EmployeeStatus.ON_LEAVE: return 'status-leave';
      default: return '';
    }
  }

  getBranchName(id?: number): string {
    if (!id) return 'No Branch';
    return this.branches().find(b => b.id === id)?.branchName || 'Unknown Branch';
  }
}
