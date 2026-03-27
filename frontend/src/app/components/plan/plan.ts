import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PlanService } from '../../services/plan.service';
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
        console.error('Error fetching plans', err);
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

  onDelete(plan: Plan): void {
    if (confirm(`Are you sure you want to delete plan: ${plan.name}?`)) {
      this.planService.deletePlan(plan.id!).subscribe({
        next: () => {
          alert('Plan deleted successfully!');
          this.plans.update(prev => prev.filter(p => p.id !== plan.id));
        },
        error: (err) => alert('Failed to delete plan.')
      });
    }
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.planForm.reset();
  }

  onSubmit(): void {
    if (this.planForm.valid) {
      const planData = this.planForm.value;
      
      if (this.isEditing()) {
        this.planService.updatePlan(this.editingId()!, planData).subscribe({
          next: (updated) => {
            alert('Plan updated successfully!');
            this.plans.update(prev => prev.map(p => p.id === updated.id ? updated : p));
            this.cancelEdit();
          },
          error: (err) => alert('Error updating plan.')
        });
      } else {
        this.planService.addPlan(planData).subscribe({
          next: (newPlan) => {
            alert('Plan added successfully!');
            this.plans.update(prev => [...prev, newPlan]);
            this.planForm.reset();
          },
          error: (err) => alert('Error adding plan.')
        });
      }
    }
  }
}
