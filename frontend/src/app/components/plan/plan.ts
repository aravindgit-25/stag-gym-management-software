import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { PlanService } from '../../services/plan.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';
import { Plan } from '../../models/plan.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';
import { AppStagTableComponent, StagTableColumn } from '../../shared/components/stag-table/stag-table';
import { AppModalComponent } from '../../shared/components/app-modal/app-modal';

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AppButtonComponent, AppStagTableComponent, AppModalComponent],
  templateUrl: './plan.html',
  styleUrl: './plan.css'
})
export class PlanComponent implements OnInit {
  planForm: FormGroup;
  plans = signal<Plan[]>([]);
  searchTerm = signal<string>('');
  loading = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);
  showModal = signal<boolean>(false);
  
  private notif = inject(NotificationService);
  private confirm = inject(ConfirmService);
  private location = inject(Location);

  columns: StagTableColumn[] = [
    { field: 'id', header: 'ID', width: '80px' },
    { field: 'name', header: 'Plan Name', minWidth: '250px' },
    { field: 'duration', header: 'Duration (Days)', width: '150px' },
    { field: 'price', header: 'Price (₹)', width: '150px' }
  ];

  filteredPlans = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.plans().filter(p => 
      p.name.toLowerCase().includes(term)
    );
  });

  constructor(private fb: FormBuilder, private planService: PlanService) {
    this.planForm = this.fb.group({
      name: ['', Validators.required],
      duration: ['', [Validators.required, Validators.min(1)]],
      price: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.loading.set(true);
    this.planService.getPlans().subscribe({
      next: (data) => {
        this.plans.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.notif.show('Error fetching plans', 'error');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  openAddModal() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.planForm.reset();
    this.showModal.set(true);
  }

  onEdit(plan: Plan): void {
    this.isEditing.set(true);
    this.editingId.set(plan.id || null);
    this.planForm.patchValue(plan);
    this.showModal.set(true);
  }

  async onDelete(plan: Plan) {
    const confirmed = await this.confirm.ask(`Are you sure you want to delete plan: ${plan.name}?`);
    if (confirmed) {
      this.planService.deletePlan(plan.id!).subscribe({
        next: () => {
          this.notif.show('Plan deleted successfully!', 'error');
          this.plans.update(prev => prev.filter(p => p.id !== plan.id));
        },
        error: (err) => this.notif.show('Failed to delete plan.', 'error')
      });
    }
  }

  closeModal(): void {
    this.showModal.set(false);
    this.isEditing.set(false);
    this.editingId.set(null);
    this.planForm.reset();
  }

  async onSubmit() {
    if (this.planForm.valid) {
      const planData = this.planForm.value;
      const action = this.isEditing() ? 'update' : 'save';
      
      const confirmed = await this.confirm.ask(`Are you sure you want to ${action} this plan?`);
      if (!confirmed) return;

      if (this.isEditing()) {
        this.planService.updatePlan(this.editingId()!, planData).subscribe({
          next: (updated) => {
            this.notif.show('Plan updated successfully!', 'success');
            this.plans.update(prev => prev.map(p => p.id === updated.id ? updated : p));
            this.closeModal();
          },
          error: (err) => this.notif.show('Error updating plan.', 'error')
        });
      } else {
        this.planService.addPlan(planData).subscribe({
          next: (newPlan) => {
            this.notif.show('Plan added successfully!', 'success');
            this.plans.update(prev => [...prev, newPlan]);
            this.closeModal();
          },
          error: (err) => this.notif.show('Error adding plan.', 'error')
        });
      }
    }
  }
}
