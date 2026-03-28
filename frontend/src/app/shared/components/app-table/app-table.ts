import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  field: string;
  header: string;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-table.html',
  styleUrl: './app-table.css'
})
export class AppTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() emptyMessage: string = 'No records found.';
  @Input() showActions: boolean = false;
  @Input() showRenew: boolean = false;
  @Input() showPrint: boolean = false;
  @Input() showView: boolean = false;
  
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() renew = new EventEmitter<any>();
  @Output() print = new EventEmitter<any>();
  @Output() view = new EventEmitter<any>();
}
