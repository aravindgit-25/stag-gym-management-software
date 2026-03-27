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
    { field: 'branchId', header: 'Branch ID' }
  ];

  constructor(
    private fb: FormBuilder,
    private memberService: MemberService
  ) {
    this.memberForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      gender: ['Male', Validators.required],
      branchId: [1, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading.set(true);
    this.memberService.getMembers().subscribe({
      next: (data) => {
        this.members.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching members', err);
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.memberForm.valid) {
      this.memberService.addMember(this.memberForm.value).subscribe({
        next: (newMember) => {
          this.members.update(prev => [...prev, newMember]);
          this.memberForm.reset({ gender: 'Male', branchId: 1 });
        },
        error: (err) => {
          console.error('Error adding member', err);
          alert('Failed to add member. Check backend logs.');
        }
      });
    }
  }
}
