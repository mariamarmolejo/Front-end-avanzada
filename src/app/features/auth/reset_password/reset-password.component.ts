import {
  Component,
  OnInit,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  FormControl,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/Notification.service';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css']
})
export class ResetPassword implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  /** Formulario: 6 dígitos + nueva contraseña */
  verificationForm: FormGroup = this.fb.group({
    digit0: new FormControl<string | null>(null, [Validators.required, Validators.pattern(/^\d$/)]),
    digit1: new FormControl<string | null>(null, [Validators.required, Validators.pattern(/^\d$/)]),
    digit2: new FormControl<string | null>(null, [Validators.required, Validators.pattern(/^\d$/)]),
    digit3: new FormControl<string | null>(null, [Validators.required, Validators.pattern(/^\d$/)]),
    digit4: new FormControl<string | null>(null, [Validators.required, Validators.pattern(/^\d$/)]),
    digit5: new FormControl<string | null>(null, [Validators.required, Validators.pattern(/^\d$/)]),
    password: new FormControl<string | null>(null, [
      Validators.required,
      Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*$/)
    ])
  });

  isSubmitting = false;
  isResend = false;
  resendDisabled = false;
  secondsLeft = 0;
  private countdownSub?: Subscription;

  ngOnInit(): void {
    // this.startCountdown(); // si quieres iniciar conteo al cargar
  }

  ngOnDestroy(): void {
    this.countdownSub?.unsubscribe();
  }

/** Dentro de ValidateResetPassword component */

submitCode(): void {
  if (this.verificationForm.invalid) {
    this.notificationService.error('Por favor completa todos los campos del código y la contraseña.');
    this.verificationForm.markAllAsTouched();
    return;
  }
  if (this.isSubmitting) return; // evita doble clic

  this.isSubmitting = true;
  const code = [
    this.verificationForm.value.digit0,
    this.verificationForm.value.digit1,
    this.verificationForm.value.digit2,
    this.verificationForm.value.digit3,
    this.verificationForm.value.digit4,
    this.verificationForm.value.digit5
  ].join('');
  const newPassword = this.verificationForm.value.password!;

  this.authService.resetPasswordWithCode({ code, newPassword })
    .subscribe({
      next: () => {
        this.notificationService.success('✅ Contraseña restablecida exitosamente');
        this.router.navigate(['/login']);
      },
      error: err => {
        console.error('Error completo al restablecer contraseña:', err);

        const status = err.status;
        let message = 'Ocurrió un error al restablecer la contraseña.';

        if (status === 400) {
          // parsear mensaje del backend (string JSON o objeto)
          let apiError: any;
          try {
            apiError = typeof err.error === 'string'
              ? JSON.parse(err.error)
              : err.error;
          } catch {
            apiError = { message: err.error };
          }
          const backendMsg = apiError.message?.toLowerCase() ?? '';

          if (backendMsg.includes('no es válido para recuperar contraseña')) {
            message = 'El código no es válido para recuperar contraseña.';
          } else if (backendMsg.includes('código inválido')) {
            message = 'El código es inválido.';
          } else if (backendMsg.includes('ha expirado')) {
            message = 'El código ha expirado.';
          } else {
            message = apiError.message || 'Solicitud incorrecta.';
          }
        }
        else if (status === 404) {
          message = 'Usuario no encontrado.';
        }
        else if (status === 500) {
          message = 'Error interno del servidor.';
        }

        this.notificationService.error(message);
        this.isSubmitting = false;
      }
    });
}

resendCode(): void {
  if (this.resendDisabled) return;
  if (this.isSubmitting) return; // evita doble clic
  if (this.isResend) return; // evita doble clic

  this.isResend = true;
  const email = sessionStorage.getItem('email');
  if (!email) {
    this.notificationService.error('No se encontró el email del usuario.');
    return;
  }

  this.authService.resendResetPasswordCode(email).subscribe({
    next: () => {
      this.startCountdown(); // reinicia el temporizador
      this.notificationService.success('¡Código reenviado exitosamente!');
      this.isResend = false;
    },
    error: err => {
      const status = err.status;
      let message = 'Ocurrió un error al reenviar el código.';

      if (status === 404) message = 'Usuario no encontrado.';
      else if (status === 500) message = 'Error interno del servidor.';

      this.notificationService.error(message);
      this.isResend = false;
    }
  });
}

  /** Contador para reenvío */
  private startCountdown(): void {
    this.countdownSub?.unsubscribe();
    this.resendDisabled = true;
    this.secondsLeft = 120;
    this.countdownSub = interval(1000)
      .pipe(takeWhile(() => this.secondsLeft > 0))
      .subscribe(() => {
        this.secondsLeft--;
        if (this.secondsLeft === 0) this.resendDisabled = false;
      });
  }

  get formattedTime(): string {
    const mm = Math.floor(this.secondsLeft / 60)
      .toString()
      .padStart(2, '0');
    const ss = (this.secondsLeft % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }

  /** Auto-avanzar foco en inputs de código */
  onCodeInput(event: Event, idx: number): void {
    const input = event.target as HTMLInputElement;
    const onlyDigit = input.value.replace(/\D/g, '').slice(0, 1);
    const controlName = `digit${idx}` as keyof typeof this.verificationForm.controls;
    this.verificationForm.controls[controlName].setValue(onlyDigit, { emitEvent: false });
    if (onlyDigit && idx < this.digitInputs.length - 1) {
      this.digitInputs.toArray()[idx + 1].nativeElement.focus();
    }
  }
}
