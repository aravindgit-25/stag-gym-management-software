import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PlanService } from '../../services/plan.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';
import { Plan } from '../../models/plan.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';
import { AppTableComponent, TableColumn } from '../../shared/components/app-table/app-table';

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppButtonComponent, AppTableComponent],
  templateUrl: './plan.html',
  styleUrl: './plan.css'
})
export class PlanComponent implements OnInit {
  planForm: FormGroup;
  plans = signal<Plan[]>([]);
  loading = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);
  
  private notif = inject(NotificationService);
  private confirm = inject(ConfirmService);

  columns: TableColumn[] = [
    { field: 'id', header: 'ID' },
    { field: 'name', header: 'Plan Name' },
    { field: 'duration', header: 'Duration (Days)' },
    { field: 'price', header: 'Price (₹)' }
  ];

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

  onEdit(plan: Plan): void {
    this.isEditing.set(true);
    this.editingId.set(plan.id || null);
    this.planForm.patchValue(plan);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  cancelEdit(): void {
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
            this.cancelEdit();
          },
          error: (err) => this.notif.show('Error updating plan.', 'error')
        });
      } else {
        this.planService.addPlan(planData).subscribe({
          next: (newPlan) => {
            this.notif.show('Plan added successfully!', 'success');
            this.plans.update(prev => [...prev, newPlan]);
            this.planForm.reset();
          },
          error: (err) => this.notif.show('Error adding plan.', 'error')
        });
      }
    }
  }
}
