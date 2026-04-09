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
import { LeadService } from '../../services/lead.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';
import { Lead, LeadStatus } from '../../models/lead.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';
import {
  AppStagTableComponent,
  StagTableColumn,
} from '../../shared/components/stag-table/stag-table';
import { AppModalComponent } from '../../shared/components/app-modal/app-modal';

@Component({
  selector: 'app-lead',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AppButtonComponent,
    AppStagTableComponent,
    AppModalComponent,
  ],
  templateUrl: './lead.html',
  styleUrl: './lead.css',
})
export class LeadComponent implements OnInit {
  leadForm: FormGroup;
  followUpForm: FormGroup;

  leads = signal<Lead[]>([]);
  searchTerm = signal<string>('');
  loading = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);
  showLeadModal = signal<boolean>(false);
  showFollowUpModal = signal<boolean>(false);
  selectedLeadForFollowUp = signal<Lead | null>(null);

  leadStatuses = Object.values(LeadStatus);

  private router = inject(Router);
  private location = inject(Location);
  private notif = inject(NotificationService);
  private confirm = inject(ConfirmService);
  private leadService = inject(LeadService);

  tableColumns = computed<StagTableColumn[]>(() => [
    { field: 'name', header: 'Name', minWidth: '150px' },
    { field: 'phone', header: 'Phone', width: '130px' },
    { field: 'status', header: 'Status', width: '150px' },
    { field: 'goal', header: 'Goal', width: '150px' },
    { field: 'planToJoinDate', header: 'Plan to Join', width: '130px' },
    { field: 'nextFollowUpDate', header: 'Next Follow-up', width: '130px' },
  ]);

  constructor(private fb: FormBuilder) {
    this.leadForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      location: ['', Validators.required],
      goal: ['', Validators.required],
      status: [LeadStatus.NEW, Validators.required],
      planToJoinDate: ['', Validators.required],
      nextFollowUpDate: ['', Validators.required],
      notes: [''],
    });

    this.followUpForm = this.fb.group({
      notes: ['', Validators.required],
      nextFollowUpDate: ['', Validators.required],
      status: [LeadStatus.FOLLOW_UP],
    });
  }

  ngOnInit(): void {
    this.loadLeads();
  }

  loadLeads(): void {
    this.loading.set(true);
    this.leadService.getLeads()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.leads.set(data),
        error: (err) => this.notif.show('Error fetching leads.', 'error'),
      });
  }

  openAddModal() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.leadForm.reset({
      status: LeadStatus.NEW,
    });
    this.showLeadModal.set(true);
  }

  onEdit(lead: Lead): void {
    this.isEditing.set(true);
    this.editingId.set(lead.id || null);
    this.leadForm.patchValue(lead);
    this.showLeadModal.set(true);
  }

  async onDelete(lead: Lead) {
    const confirmed = await this.confirm.ask(
      `Are you sure you want to delete lead: ${lead.name}?`,
    );
    if (confirmed) {
      this.leadService.deleteLead(lead.id!).subscribe({
        next: () => {
          this.notif.show('Lead deleted successfully!', 'error');
          this.loadLeads();
        },
        error: (err) => this.notif.show('Failed to delete lead.', 'error'),
      });
    }
  }

  onFollowUp(lead: Lead) {
    this.selectedLeadForFollowUp.set(lead);
    this.followUpForm.reset({
      status: lead.status === LeadStatus.NEW ? LeadStatus.FOLLOW_UP : lead.status,
      nextFollowUpDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // Default 2 days later
    });
    this.showFollowUpModal.set(true);
  }

  async onConvert(lead: Lead) {
    const confirmed = await this.confirm.ask(
      `Convert ${lead.name} to a member?`,
    );
    if (confirmed) {
      this.leadService.convertLead(lead.id!).subscribe({
        next: (member) => {
          this.notif.show('Lead converted to member successfully!', 'success');
          this.loadLeads();
          // Optionally redirect to member edit or list
          // this.router.navigate(['/members']);
        },
        error: (err) => this.notif.show('Failed to convert lead.', 'error'),
      });
    }
  }

  onSubmitLead() {
    if (this.leadForm.valid) {
      const leadData = this.leadForm.value;
      if (this.isEditing()) {
        this.leadService.updateLead(this.editingId()!, leadData).subscribe({
          next: () => {
            this.notif.show('Lead updated successfully!', 'success');
            this.loadLeads();
            this.showLeadModal.set(false);
          },
          error: (err) => this.notif.show('Error updating lead.', 'error'),
        });
      } else {
        this.leadService.addLead(leadData).subscribe({
          next: () => {
            this.notif.show('Lead added successfully!', 'success');
            this.loadLeads();
            this.showLeadModal.set(false);
          },
          error: (err) => this.notif.show('Error adding lead.', 'error'),
        });
      }
    }
  }

  onSubmitFollowUp() {
    if (this.followUpForm.valid && this.selectedLeadForFollowUp()) {
      const { notes, nextFollowUpDate, status } = this.followUpForm.value;
      this.leadService.addFollowUp(this.selectedLeadForFollowUp()!.id!, notes, nextFollowUpDate, status).subscribe({
        next: () => {
          this.notif.show('Follow-up added successfully!', 'success');
          this.loadLeads();
          this.showFollowUpModal.set(false);
        },
        error: (err) => this.notif.show('Error adding follow-up.', 'error'),
      });
    }
  }

  closeLeadModal() {
    this.showLeadModal.set(false);
  }

  closeFollowUpModal() {
    this.showFollowUpModal.set(false);
  }

  goBack(): void {
    this.location.back();
  }

  filteredLeads = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.leads().filter(
      (l) => l.name.toLowerCase().includes(term) || l.phone.includes(term)
    ).map(l => ({
      ...l,
      rowClass: this.getStatusClass(l.status)
    }));
  });

  getStatusClass(status: LeadStatus): string {
    switch (status) {
      case LeadStatus.NEW: return 'status-new';
      case LeadStatus.FOLLOW_UP: return 'status-followup';
      case LeadStatus.JOINED: return 'status-joined';
      case LeadStatus.NOT_INTERESTED: return 'status-not-interested';
      case LeadStatus.JOINED_ELSEWHERE: return 'status-elsewhere';
      default: return '';
    }
  }
}
