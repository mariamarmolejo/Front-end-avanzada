// src/app/shared/confirm-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

export interface ConfirmDialogData {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Si es true, muestra un textarea y devuelve el texto en lugar de boolean */
  input?: boolean;
  /** Placeholder para el textarea */
  inputPlaceholder?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title || 'Confirmar' }}</h2>
    <mat-dialog-content class="dialog-content">
      <p>{{ data.message }}</p>
      <ng-container *ngIf="data.input">
        <textarea
          [(ngModel)]="inputValue"
          class="full-width textarea"
          rows="4"
          placeholder="{{ data.inputPlaceholder || '' }}"
        ></textarea>
      </ng-container>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        {{ data.cancelText || 'Cancelar' }}
      </button>
      <button
        mat-flat-button
        [color]="data.input ? 'warn' : 'primary'"
        (click)="onConfirm()"
        [disabled]="data.input && !inputValue.trim()"
      >
        {{ data.confirmText || (data.input ? 'Enviar' : 'Aceptar') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      padding-right: 16px;
    }
    .textarea {
      width: 90%;
      margin-top: 1rem;
      font-size: 14px;
      padding: .5rem;
    }
  `]
})

export class ConfirmDialogComponent {
  inputValue = '';

  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    if (data.input && data.inputPlaceholder) {
      this.inputValue = '';
    }
  }

  onConfirm(): void {
    // Si es diálogo con input, devuelve el texto, si no, true
    this.dialogRef.close(this.data.input ? this.inputValue.trim() : true);
  }
  onCancel(): void {
    this.dialogRef.close(false);
  }
}
