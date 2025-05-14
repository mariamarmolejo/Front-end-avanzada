import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/Notification.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/dialog/confirm-dialog.component';
import { UserResponse } from '../../core/models/users/user-response.model';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule, 
    MatProgressSpinner
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private authService    = inject(AuthService);
  private notification   = inject(NotificationService);
  private router         = inject(Router);
  private dialog         = inject(MatDialog);

  user?: UserResponse;
  loading = true;

  ngOnInit(): void {
    this.authService.getMe().subscribe({
      next: user => {
        this.user = user;
      },
      error: err => {
        console.error('Error al cargar perfil', err);
        this.notification.error('No fue posible cargar tu perfil');
        this.router.navigate(['/']);
      },
      complete: () => this.loading = false
    });
  }

  onEditData(): void {
    this.router.navigate(['/user/edit']);
  }

  onUpdatePassword(): void {
    this.router.navigate(['/user/edit/password']);
  }

  onDeleteAccount(): void {
    if (!this.user?.id) return;

    const data: ConfirmDialogData = {
      title: 'Eliminar cuenta',
      message: '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    };

    this.dialog.open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.authService.deleteUser(this.user!.id).subscribe({
            next: () => {
              this.notification.success('Cuenta eliminada correctamente');
              this.router.navigate(['/login']);
            },
            error: err => {
              console.error('Error al eliminar cuenta', err);
              this.notification.error('No se pudo eliminar tu cuenta');
            }
          });
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/map']);
  }
}
