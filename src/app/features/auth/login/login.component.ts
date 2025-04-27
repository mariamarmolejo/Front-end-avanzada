import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

// Import de Material
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router'; // <-- IMPORTA ESTO

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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar       // ← inyecta el SnackBar
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

    const { email, password } = this.registerForm.value;
    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.snackBar.open('¡Bienvenido!', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.router.navigate(['/map']);
      },
      error: err => {
        // Determina mensaje según el status
        const status = err.status;
        let message = 'Ocurrió un error. Intenta de nuevo.';

        if (status === 400)      message = err.error?.message || 'Campos inválidos.';
        else if (status === 404) message = 'Usuario no encontrado.';
        else if (status === 500) message = 'Error interno del servidor.';

        // SnackBar de error
        this.snackBar.open(message, 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']  // opcional: agrega una clase CSS para estilo
        });
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

