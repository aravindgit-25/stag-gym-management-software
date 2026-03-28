import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface StagTableColumn {
  field: string;
  header: string;
  width?: string;
  type?: 'text' | 'date' | 'number' | 'boolean' | 'template' | 'action-button';
  sortable?: boolean;
}

export interface BulkAction {
  label: string;
  icon?: string;
  action: (selectedItems: any[]) => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

@Component({
  selector: 'app-stag-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stag-table.html',
  styleUrl: './stag-table.css'
})
export class AppStagTableComponent {
  @Input() columns: StagTableColumn[] = [];
  @Input() data: any[] = [];
  @Input() height: string = 'auto';
  @Input() loading: boolean = false;
  @Input() totalRecords: number = 0;
  @Input() storageKey: string = '';
  @Input() showSelectionColumn: boolean = false;
  @Input() enableBulkActions: boolean = false;
  @Input() bulkActions: BulkAction[] = [];
  @Input() editingRowIndex: number | null = null;
  @Input() emptyMessage: string = 'No records found.';

  @Input() showActions: boolean = false;
  @Input() showRenew: boolean = false;
  @Input() showPrint: boolean = false;
  @Input() showView: boolean = false;

  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() cellChange = new EventEmitter<any>();
  @Output() rowEdit = new EventEmitter<any>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() globalSearchChange = new EventEmitter<string>();

  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() renew = new EventEmitter<any>();
  @Output() print = new EventEmitter<any>();
  @Output() view = new EventEmitter<any>();

  selectedItems = signal<any[]>([]);
  searchTerm = signal<string>('');

  onRowClickInternal(row: any) {
    this.rowClick.emit(row);
  }

  toggleSelection(item: any, event: Event) {
    event.stopPropagation();
    const currentSelected = this.selectedItems();
    const index = currentSelected.indexOf(item);
    
    if (index === -1) {
      this.selectedItems.set([...currentSelected, item]);
    } else {
      this.selectedItems.set(currentSelected.filter(i => i !== item));
    }
    this.selectionChange.emit(this.selectedItems());
  }

  toggleAll(event: any) {
    if (event.target.checked) {
      this.selectedItems.set([...this.data]);
    } else {
      this.selectedItems.set([]);
    }
    this.selectionChange.emit(this.selectedItems());
  }

  isSelected(item: any): boolean {
    return this.selectedItems().includes(item);
  }

  onGlobalSearch(value: string) {
    this.searchTerm.set(value);
    this.globalSearchChange.emit(value);
  }
}
