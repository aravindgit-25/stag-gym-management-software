import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-stag-checkbox',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StagCheckboxComponent),
      multi: true
    }
  ],
  template: `
    <label class="stag-checkbox-container" [class.disabled]="disabled">
      <input 
        type="checkbox" 
        [checked]="checked" 
        [disabled]="disabled"
        (change)="onCheckboxChange($event)"
      >
      <span class="checkmark"></span>
      <span class="label-text" *ngIf="label">{{ label }}</span>
    </label>
  `,
  styles: [`
    .stag-checkbox-container {
      display: inline-flex;
      align-items: center;
      position: relative;
      padding-left: 28px;
      margin-bottom: 0;
      cursor: pointer;
      font-size: 14px;
      user-select: none;
      min-height: 20px;
    }

    .stag-checkbox-container input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    .checkmark {
      position: absolute;
      top: 0;
      left: 0;
      height: 20px;
      width: 20px;
      background-color: #fff;
      border: 2px solid #cbd5e0;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .stag-checkbox-container:hover input ~ .checkmark {
      border-color: #4299e1;
    }

    .stag-checkbox-container input:checked ~ .checkmark {
      background-color: #4299e1;
      border-color: #4299e1;
    }

    .checkmark:after {
      content: "";
      position: absolute;
      display: none;
    }

    .stag-checkbox-container input:checked ~ .checkmark:after {
      display: block;
    }

    .stag-checkbox-container .checkmark:after {
      left: 6px;
      top: 2px;
      width: 5px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .label-text {
      margin-left: 4px;
      color: #2d3748;
    }

    .disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  `]
})
export class StagCheckboxComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() checked: boolean = false;
  @Input() disabled: boolean = false;
  @Output() changed = new EventEmitter<boolean>();

  onChange: any = () => {};
  onTouched: any = () => {};

  onCheckboxChange(event: Event) {
    if (this.disabled) return;
    this.checked = (event.target as HTMLInputElement).checked;
    this.onChange(this.checked);
    this.onTouched();
    this.changed.emit(this.checked);
  }

  writeValue(value: any): void {
    this.checked = !!value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
