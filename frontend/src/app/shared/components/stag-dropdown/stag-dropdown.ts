import { Component, Input, Output, EventEmitter, signal, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StagCheckboxComponent } from '../stag-checkbox/stag-checkbox';

export interface DropdownItem {
  id: any;
  label: string;
  subLabel?: string;
  data?: any;
}

@Component({
  selector: 'app-stag-dropdown',
  standalone: true,
  imports: [CommonModule, StagCheckboxComponent],
  template: `
    <div class="stag-dropdown" [class.open]="isOpen()">
      <div class="dropdown-trigger" (click)="toggle()">
        <div class="selected-count" *ngIf="selectedIds().length > 0">
          {{ selectedIds().length }}
        </div>
        <div class="placeholder" [class.has-selection]="selectedIds().length > 0">
          {{ displayText() }}
        </div>
        <div class="arrow">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <div class="dropdown-menu" *ngIf="isOpen()">
        <div class="menu-items">
          <div 
            *ngFor="let item of items" 
            class="menu-item" 
            [class.selected]="isSelected(item.id)"
            (click)="toggleItem($event, item)"
          >
            <app-stag-checkbox 
              [checked]="isSelected(item.id)"
              (changed)="onCheckboxChange($event, item)"
            ></app-stag-checkbox>
            <div class="item-info">
              <span class="item-label">{{ item.label }}</span>
              <span class="item-sub" *ngIf="item.subLabel">{{ item.subLabel }}</span>
            </div>
          </div>
        </div>
        <div class="menu-footer" *ngIf="items.length > 0">
          <button type="button" class="btn-clear" (click)="clearAll($event)">Clear All</button>
          <button type="button" class="btn-done" (click)="close()">Done</button>
        </div>
        <div class="no-results" *ngIf="items.length === 0">
          No items found
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stag-dropdown {
      position: relative;
      width: 100%;
      font-family: inherit;
    }

    .dropdown-trigger {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      cursor: pointer;
      min-height: 46px;
      transition: all 0.2s;
      gap: 12px;
    }

    .dropdown-trigger:hover {
      border-color: #cbd5e0;
      background: #f8fafc;
    }

    .open .dropdown-trigger {
      border-color: #4299e1;
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
      background: white;
    }

    .selected-count {
      background: #4299e1;
      color: white;
      font-size: 11px;
      font-weight: 700;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .placeholder {
      flex: 1;
      color: #718096;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .placeholder.has-selection {
      color: #2d3748;
      font-weight: 500;
    }

    .arrow {
      color: #a0aec0;
      transition: transform 0.2s;
    }

    .open .arrow {
      transform: rotate(180deg);
      color: #4299e1;
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      z-index: 1000;
      overflow: hidden;
      animation: slideDown 0.15s ease-out;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .menu-items {
      max-height: 280px;
      overflow-y: auto;
      padding: 6px;
    }

    .menu-item {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      gap: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .menu-item:hover {
      background: #f7fafc;
    }

    .menu-item.selected {
      background: #ebf8ff;
    }

    .item-info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .item-label {
      font-size: 14px;
      font-weight: 500;
      color: #2d3748;
    }

    .item-sub {
      font-size: 12px;
      color: #718096;
    }

    .menu-footer {
      display: flex;
      justify-content: space-between;
      padding: 10px 12px;
      border-top: 1px solid #edf2f7;
      background: #f8fafc;
    }

    .btn-clear {
      background: none;
      border: none;
      color: #e53e3e;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .btn-clear:hover {
      background: #fff5f5;
    }

    .btn-done {
      background: #4299e1;
      border: none;
      color: white;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      padding: 4px 12px;
      border-radius: 6px;
    }

    .btn-done:hover {
      background: #3182ce;
    }

    .no-results {
      padding: 20px;
      text-align: center;
      color: #718096;
      font-size: 14px;
    }
  `]
})
export class StagDropdownComponent {
  @Input() items: DropdownItem[] = [];
  @Input() placeholder: string = 'Select items...';
  @Input() selectedIds = signal<any[]>([]);
  @Output() selectionChange = new EventEmitter<any[]>();

  isOpen = signal<boolean>(false);
  private elementRef = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  toggle() {
    this.isOpen.update(val => !val);
  }

  close() {
    this.isOpen.set(false);
  }

  isSelected(id: any): boolean {
    return this.selectedIds().includes(id);
  }

  toggleItem(event: Event, item: DropdownItem) {
    event.stopPropagation();
    this.updateSelection(item.id);
  }

  onCheckboxChange(checked: boolean, item: DropdownItem) {
    this.updateSelection(item.id);
  }

  private updateSelection(id: any) {
    const current = this.selectedIds();
    let updated: any[];
    
    if (current.includes(id)) {
      updated = current.filter(i => i !== id);
    } else {
      updated = [...current, id];
    }
    
    this.selectedIds.set(updated);
    this.selectionChange.emit(updated);
  }

  clearAll(event: Event) {
    event.stopPropagation();
    this.selectedIds.set([]);
    this.selectionChange.emit([]);
  }

  displayText(): string {
    const selected = this.selectedIds();
    if (selected.length === 0) return this.placeholder;
    
    const selectedLabels = this.items
      .filter(i => selected.includes(i.id))
      .map(i => i.label);
      
    if (selectedLabels.length <= 2) {
      return selectedLabels.join(', ');
    }
    
    return `${selectedLabels[0]}, ${selectedLabels[1]} +${selectedLabels.length - 2} more`;
  }
}
