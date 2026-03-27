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
  imports: [CommonModule, ReactiveFormsModule, AppButtonComponent, AppTableComponent],
  templateUrl: './member.html',
  styleUrl: './member.css'
})
export class MemberComponent implements OnInit {
  memberForm: FormGroup;
  members = signal<Member[]>([]);
  loading = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);

  columns: TableColumn[] = [
    { field: 'id', header: 'ID' },
    { field: 'name', header: 'Name' },
    { field: 'phone', header: 'Phone' },
    { field: 'gender', header: 'Gender' },
    { field: 'branchId', header: 'Branch ID' }
  ];

  constructor(private fb: FormBuilder, private memberService: MemberService) {
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

  onEdit(member: Member): void {
    this.isEditing.set(true);
    this.editingId.set(member.id || null);
    this.memberForm.patchValue(member);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDelete(member: Member): void {
    if (confirm(`Are you sure you want to delete member: ${member.name}?`)) {
      this.memberService.deleteMember(member.id!).subscribe({
        next: () => {
          alert('Member deleted successfully!');
          this.members.update(prev => prev.filter(m => m.id !== member.id));
        },
        error: (err) => alert('Failed to delete member.')
      });
    }
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.memberForm.reset({ gender: 'Male', branchId: 1 });
  }

  onSubmit(): void {
    if (this.memberForm.valid) {
      const memberData = this.memberForm.value;
      
      if (this.isEditing()) {
        this.memberService.updateMember(this.editingId()!, memberData).subscribe({
          next: (updated) => {
            alert('Member updated successfully!');
            this.members.update(prev => prev.map(m => m.id === updated.id ? updated : m));
            this.cancelEdit();
          },
          error: (err) => alert('Error updating member.')
        });
      } else {
        this.memberService.addMember(memberData).subscribe({
          next: (newMember) => {
            alert('Member added successfully!');
            this.members.update(prev => [...prev, newMember]);
            this.memberForm.reset({ gender: 'Male', branchId: 1 });
          },
          error: (err) => alert('Error adding member.')
        });
      }
    }
  }
}
