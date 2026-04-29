import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PTService } from '../../services/pt.service';
import { EmployeeService } from '../../services/employee.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';
import { PTMember, PTSessionLog } from '../../models/pt.model';
import { Employee, EmployeeRole } from '../../models/employee.model';
import { AppStagTableComponent, StagTableColumn } from '../../shared/components/stag-table/stag-table';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';
import { AppModalComponent } from '../../shared/components/app-modal/app-modal';

@Component({
  selector: 'app-personal-training',
  standalone: true,
  imports: [CommonModule, FormsModule, AppStagTableComponent, AppButtonComponent, AppModalComponent],
  templateUrl: './personal-training.html',
  styleUrl: './personal-training.css'
})
export class PersonalTrainingComponent implements OnInit {
  private ptService = inject(PTService);
  private employeeService = inject(EmployeeService);
  private notificationService = inject(NotificationService);
  private confirmService = inject(ConfirmService);

  // State
  activePTMembers = signal<PTMember[]>([]);
  trainers = signal<Employee[]>([]);
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');

  // Modals
  showLogModal = signal<boolean>(false);
  showHistoryModal = signal<boolean>(false);
  
  // Selected data
  selectedMember = signal<PTMember | null>(null);
  sessionHistory = signal<PTSessionLog[]>([]);
  
  // Form data
  sessionDate = signal<string>(new Date().toISOString().split('T')[0]);
  trainerId = signal<number | null>(null);
  notes = signal<string>('');
  trainerVerification = signal<boolean>(true);
  clientVerification = signal<boolean>(false);

  // Table configuration
  columns: StagTableColumn[] = [
    { field: 'memberName', header: 'Member', minWidth: '150px' },
    { field: 'trainerName', header: 'Trainer', minWidth: '150px' },
    { field: 'planName', header: 'Plan', minWidth: '120px' },
    { field: 'totalSessions', header: 'Total', minWidth: '80px' },
    { field: 'sessionsRemaining', header: 'Remaining', minWidth: '100px' },
    { field: 'expiryDate', header: 'Expiry', minWidth: '120px', type: 'text' },
    { field: 'actions', header: 'Actions', minWidth: '200px', type: 'template' }
  ];

  filteredMembers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.activePTMembers().filter(m => 
      m.memberName.toLowerCase().includes(term) || 
      m.trainerName.toLowerCase().includes(term) ||
      m.memberPhone?.includes(term)
    );
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.ptService.getActivePTMembers().subscribe({
      next: (data) => {
        console.log('Active PT Members from Backend:', data);
        this.activePTMembers.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading PT members:', err);
        this.notificationService.show('Failed to load PT members', 'error');
        this.loading.set(false);
      }
    });

    this.employeeService.getActiveEmployees().subscribe({
      next: (data) => {
        this.trainers.set(data.filter(e => e.role === EmployeeRole.TRAINER));
      }
    });
  }

  openLogSession(member: PTMember) {
    this.selectedMember.set(member);
    this.trainerId.set(member.trainerId);
    this.sessionDate.set(new Date().toISOString().split('T')[0]);
    this.notes.set('');
    this.clientVerification.set(false);
    this.showLogModal.set(true);
  }

  closeLogModal() {
    this.showLogModal.set(false);
    this.selectedMember.set(null);
  }

  submitSession() {
    const member = this.selectedMember();
    if (!member || !this.trainerId()) return;

    const log: PTSessionLog = {
      ptMemberId: member.id,
      date: this.sessionDate(),
      trainerId: this.trainerId()!,
      trainerVerification: this.trainerVerification(),
      clientVerification: this.clientVerification(),
      notes: this.notes()
    };

    this.ptService.logSession(log).subscribe({
      next: () => {
        this.notificationService.show('Session logged successfully', 'success');
        this.closeLogModal();
        this.loadData();
      },
      error: (err) => {
        this.notificationService.show(err.error?.message || 'Failed to log session', 'error');
      }
    });
  }

  viewHistory(member: PTMember) {
    this.selectedMember.set(member);
    this.ptService.getSessionHistory(member.id).subscribe({
      next: (data) => {
        this.sessionHistory.set(data);
        this.showHistoryModal.set(true);
      },
      error: () => {
        this.notificationService.show('Failed to load session history', 'error');
      }
    });
  }

  closeHistoryModal() {
    this.showHistoryModal.set(false);
    this.selectedMember.set(null);
  }
}
