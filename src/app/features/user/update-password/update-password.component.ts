import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/Notification.service';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-password-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIcon],
  templateUrl: './password-update.component.html',
  styleUrls: ['./password-update.component.css']
})
export class PasswordUpdateComponent implements OnInit {
  passwordForm!: FormGroup;
  isSubmitting = false;
  userId!: string;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.authService.getMe().subscribe({
      next: (user) => this.userId = user.id,
      error: () => {
        this.notificationService.error('Error al obtener información del usuario');
        this.router.navigate(['/']);
      }
    });
  }

  private initForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(50),
          Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*$/)
        ]
      ]
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.passwordForm.get(controlName);
    return !!(control && control.touched && control.hasError(errorName));
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const dto = this.passwordForm.value;

    this.authService.updatePassword(this.userId, dto).subscribe({
      next: () => {
        this.notificationService.success('Contraseña actualizada correctamente');
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        const msg = err.error?.message || 'Error al actualizar la contraseña';
        this.notificationService.error(msg);
        this.isSubmitting = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}
