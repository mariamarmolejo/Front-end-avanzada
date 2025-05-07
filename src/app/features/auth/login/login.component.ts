import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/Notification.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router'; // <-- IMPORTA ESTO
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    RouterModule, // <-- AGREGA ESTO
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  registerForm: FormGroup;
  loginErrorMessage = '';
  showReetPassword  = false;
  isSubmitting = false;
  isSendPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService     // ← inyecta el SnackBar

  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required
      ]]
    });
  }

  onLogin(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    if(this.isSubmitting) return;
    this.isSubmitting = true;

    const { email, password } = this.registerForm.value;
    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.notificationService.success('¡Bienvenido!');
        this.router.navigate(['/map']);
      },
      error: (error: HttpErrorResponse) => {
        const message = this.getErrorMessage(error.status, error.error?.message);
        this.notificationService.error(message);
        if(message.includes("La cuenta no está activada")){
          this.notificationService.error('La cuenta no está activada, reenviando código de activación...');
          this.resendCode();
        }
        this.isSubmitting = false;

      }
    });
  }

  private getErrorMessage(status: number, serverMessage?: string): string {
    switch (status) {
      case 400:
        this.showReetPassword  = true;
        return serverMessage || 'Campos inválidos.';
      case 403:
        return "La cuenta no está activada";
      case 404:
        return 'Usuario no encontrado.';
      case 500:
        return 'Error interno del servidor.';
      default:
        return 'Ocurrió un error. Intenta de nuevo.';
    }
  }


  sendCodePassword(): void {
    if (this.isSendPassword) return;

    const email = this.registerForm.value.email;
    if (!email || this.registerForm.get('email')?.invalid) {
      this.notificationService.error('Por favor ingresa un correo válido.');
      return;
    }

    this.isSendPassword = true;

    this.authService.requestPasswordResetCode(email).subscribe({
      next: () => {
        sessionStorage.setItem("email", email);
        this.notificationService.success('📩 Código enviado al correo.');
        this.router.navigate(['/reset-password']);
      },
      error: (error: HttpErrorResponse) => {
        switch (error.status) {
          case 404:
            this.notificationService.error('❌ Usuario no encontrado.');
            break;
          case 500:
            this.notificationService.error('⚠️ Error del servidor. Inténtalo más tarde.');
            break;
          default:
            this.notificationService.error('Ocurrió un error. Inténtalo de nuevo.');
        }
        this.isSendPassword = false;
      }
    });
  }

  resendCode(): void {
    const email = this.registerForm.value.email;
    if (!email) {
      this.notificationService.error('No se encontró el email del usuario.');
      return;
    }

    this.authService.sendCodeAgain(email).subscribe({
      next: () => {
        this.router.navigate(["/validate-account"]);
        this.notificationService.success('¡Código reenviado exitosamente!');
      },
      error: err => {
        const status = err.status;
        let message = 'Ocurrió un error al reenviar el código.';

        if (status === 404) message = 'Usuario no encontrado.';
        else if (status === 500) message = 'Error interno del servidor.';

        this.notificationService.error(message);
      }
    });
  }

  get emailInvalid(): boolean {
    const ctrl = this.registerForm.get('email');
    return !!(ctrl && ctrl.touched && ctrl.invalid);
  }

  get passwordInvalid(): boolean {
    const ctrl = this.registerForm.get('password');
    return !!(ctrl && ctrl.touched && ctrl.invalid);
  }

}

