import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogData } from '../../shared/components/dialog/confirm-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/dialog/confirm-dialog.component';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private snackBar: MatSnackBar, private dialog: MatDialog) {}

  success(message: string): void {
    this.snackBar.open(`✔️ ${message}`, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snackbar-success']
    });
  }

  error(message: string): void {
    this.snackBar.open(`❌ ${message}`, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snackbar-error']
    });
  }

  confirm(
    message: string,
    data: Partial<ConfirmDialogData> = {}
  ): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '320px',
      data: { message, ...data } as ConfirmDialogData
    });
    return dialogRef.afterClosed();
  }
}

