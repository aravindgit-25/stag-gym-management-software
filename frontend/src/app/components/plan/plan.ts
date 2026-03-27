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

  columns: TableColumn[] = [
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

  onSubmit(): void {
    if (this.planForm.valid) {
      this.planService.addPlan(this.planForm.value).subscribe({
        next: (newPlan) => {
          this.plans.update(prev => [...prev, newPlan]);
          this.planForm.reset();
        },
        error: (err) => console.error('Error adding plan', err)
      });
    }
  }
}
