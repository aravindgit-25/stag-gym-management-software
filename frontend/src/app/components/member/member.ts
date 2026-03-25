import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MemberService } from '../../services/member.service';
import { Member } from '../../models/member.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button';
import { AppTableComponent, TableColumn } from '../../shared/components/app-table/app-table';

@Component({
  selector: 'app-member',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    AppButtonComponent, 
    AppTableComponent
  ],
  templateUrl: './member.html',
  styleUrl: './member.css'
})
export class MemberComponent implements OnInit {
  memberForm: FormGroup;
  members = signal<Member[]>([]);
  loading = signal<boolean>(false);

  columns: TableColumn[] = [
    { field: 'name', header: 'Name' },
    { field: 'phone', header: 'Phone' },
    { field: 'gender', header: 'Gender' },
    { field: 'branch_id', header: 'Branch ID' }
  ];

  constructor(
    private fb: FormBuilder,
    private memberService: MemberService
  ) {
    this.memberForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      gender: ['Male', Validators.required],
      branch_id: [1, Validators.required]
    });
  }

  ngOnInit(): void {
    console.log('MemberComponent Initialized');
    this.loadMembers();
  }

  loadMembers(): void {
    console.log('Loading members...');
    this.loading.set(true);
    this.memberService.getMembers().subscribe({
      next: (data) => {
        console.log('Members loaded successfully:', data);
        this.members.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching members:', err);
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    console.log('Submit Clicked');
    if (this.memberForm.valid) {
      console.log('Form Data:', this.memberForm.value);
      this.memberService.addMember(this.memberForm.value).subscribe({
        next: (newMember) => {
          console.log('Member added successfully:', newMember);
          this.members.update(prev => [...prev, newMember]);
          this.memberForm.reset({ gender: 'Male', branch_id: 1 });
        },
        error: (err) => {
          console.error('Error adding member:', err);
          alert('Failed to add member. Check console for details.');
        }
      });
    } else {
      console.warn('Form is invalid:', this.memberForm.errors);
      // Log individual field errors
      Object.keys(this.memberForm.controls).forEach(key => {
        const controlErrors = this.memberForm.get(key)?.errors;
        if (controlErrors != null) {
          console.warn(`Field ${key} has errors:`, controlErrors);
        }
      });
    }
  }
}
