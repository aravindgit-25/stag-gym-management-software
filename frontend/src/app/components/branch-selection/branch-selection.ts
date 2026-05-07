import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BranchService } from '../../services/branch.service';
import { AuthService } from '../../services/auth.service';
import { Branch } from '../../models/branch.model';

@Component({
  selector: 'app-branch-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './branch-selection.html',
  styleUrl: './branch-selection.css'
})
export class BranchSelectionComponent implements OnInit {
  branches = signal<Branch[]>([]);
  loading = signal<boolean>(true);
  userName = signal<string>('');

  private branchService = inject(BranchService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.userName.set(this.authService.currentUser()?.name || 'Owner');
    this.loadBranches();
  }

  loadBranches() {
    this.branchService.getBranches().subscribe({
      next: (data) => {
        this.branches.set(data);
        this.loading.set(false);
      },
      error: () => {
        console.error('Failed to load branches');
        this.loading.set(false);
      }
    });
  }

  selectBranch(branch: Branch | null) {
    const id = branch ? branch.id : null;
    this.authService.setBranch(id!);
    this.router.navigate(['/dashboard']);
  }

  logout() {
    this.authService.logout();
  }
}
