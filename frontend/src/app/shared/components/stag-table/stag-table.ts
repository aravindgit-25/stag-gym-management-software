import { Component, Input, Output, EventEmitter, signal, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface StagTableColumn {
  field: string;
  header: string;
  width?: string;
  minWidth?: string;
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
  
  @ContentChild('cell') cellTemplate?: TemplateRef<any>;
  @Input() totalRecords: number = 0;
  @Input() storageKey: string = '';
  @Input() showSelectionColumn: boolean = false;
  @Input() enableBulkActions: boolean = false;
  @Input() bulkActions: BulkAction[] = [];
  @Input() editingRowIndex: number | null = null;
  @Input() emptyMessage: string = 'No records found.';
  @Input() filterTerm: string = ''; // Receives search term from parent

  @Input() showActions: boolean = false;
  @Input() showRenew: boolean = false;
  @Input() showFollowup: boolean = false;
  @Input() showConvert: boolean = false;
  @Input() showTerminate: boolean = false;
  @Input() showPrint: boolean = false;
  @Input() showView: boolean = false;

  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() cellChange = new EventEmitter<any>();
  @Output() rowEdit = new EventEmitter<any>();
  @Output() rowClick = new EventEmitter<any>();

  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() renew = new EventEmitter<any>();
  @Output() followup = new EventEmitter<any>();
  @Output() convert = new EventEmitter<any>();
  @Output() terminate = new EventEmitter<any>();
  @Output() print = new EventEmitter<any>();
  @Output() view = new EventEmitter<any>();

  selectedItems = signal<any[]>([]);
  
  // Resize logic
  private resizingColumn: StagTableColumn | null = null;
  private startX: number = 0;
  private startWidth: number = 0;
  private animationFrameId: number | null = null;

  onResizeStart(event: MouseEvent, column: StagTableColumn) {
    event.preventDefault();
    event.stopPropagation();
    this.resizingColumn = column;
    this.startX = event.pageX;
    
    const th = (event.target as HTMLElement).closest('th');
    this.startWidth = th?.getBoundingClientRect().width || 0;

    document.addEventListener('mousemove', this.onResizing);
    document.addEventListener('mouseup', this.onResizeEnd);
    document.body.style.cursor = 'col-resize';
    document.body.classList.add('is-resizing');
  }

  private onResizing = (event: MouseEvent) => {
    if (!this.resizingColumn) return;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = requestAnimationFrame(() => {
      if (this.resizingColumn) {
        const deltaX = event.pageX - this.startX;
        const newWidth = Math.max(60, this.startWidth + deltaX);
        this.resizingColumn.width = `${newWidth}px`;
      }
    });
  };

  private onResizeEnd = () => {
    this.resizingColumn = null;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    document.removeEventListener('mousemove', this.onResizing);
    document.removeEventListener('mouseup', this.onResizeEnd);
    document.body.style.cursor = 'default';
    document.body.classList.remove('is-resizing');
  };

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
}
