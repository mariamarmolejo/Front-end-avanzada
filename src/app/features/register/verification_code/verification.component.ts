import {Component,OnInit, OnDestroy, ViewChildren, QueryList, ElementRef, inject} from '@angular/core';
  import { CommonModule } from '@angular/common';
  import {ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl} from '@angular/forms';
  import { interval, Subscription } from 'rxjs';
  import { takeWhile } from 'rxjs/operators';
  import { Router } from '@angular/router';
  import { AuthService } from '../../../core/services/auth.service';
  import { NotificationService } from '../../../core/services/Notification.service';
import { error } from 'node:console';

  @Component({
    selector: 'app-verification',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './verification.component.html',
    styleUrls: ['./verification.component.css']
  })
  export class VerificationComponent implements OnInit, OnDestroy {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private notificationService = inject(NotificationService);
    private authService = inject(AuthService);
    isSubmitting = false;
    isResend  = false;


    /** Referencia a los 6 inputs para mover el foco */
    @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

    /** Definir el formulario con FormControl explícito */
    verificationForm: FormGroup = this.fb.group({
      digit0: new FormControl<string | null>(null, [Validators.required, Validators.pattern(/^\d$/)]),
      digit1: new FormControl<string | null>(null, [Validators.required, Validators.pattern(/^\d$/)]),
      digit2: new FormControl<string | null>(null, [Validators.required, Validators.pattern(/^\d$/)]),
      digit3: new FormControl<string | null>(null, [Validators.required, Validators.pattern(/^\d$/)]),
      digit4: new FormControl<string | null>(null, [Validators.required, Validators.pattern(/^\d$/)]),
      digit5: new FormControl<string | null>(null, [Validators.required, Validators.pattern(/^\d$/)]),
    });

    resendDisabled = false;
    secondsLeft = 0;
    private countdownSub?: Subscription;

    ngOnInit(): void {
      //this.startCountdown();
    }

    ngOnDestroy(): void {
      this.countdownSub?.unsubscribe();
    }

    submitCode(): void {
      if (this.verificationForm.invalid) {
        this.notificationService.error('Por favor completa todos los campos del código.');
        this.verificationForm.markAllAsTouched();
        return;
      }
      if (this.isSubmitting) return; // evita doble clic

      this.isSubmitting = true;
      const code = Object.values(this.verificationForm.value).join('');

      this.authService.validateAccount(code).subscribe({
        next: () => {
          this.notificationService.success('✅ Cuenta validada exitosamente');
          sessionStorage.removeItem("Email");
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Error completo al validar cuenta:', err);

          const status = err.status;
          let message = 'Ocurrió un error al validar la cuenta.';

          if (status === 400) {
            // err.error viene como string con un JSON; parseémoslo
            let apiError: any;
            try {
              apiError = typeof err.error === 'string'
                ? JSON.parse(err.error)
                : err.error;
            } catch {
              apiError = { message: err.error };
            }

            // Ahora sí podemos leer el mensaje
            const backendMsg = apiError.message?.toLowerCase() ?? '';

            if (backendMsg.includes('código inválido')) {
              message = 'El código es inválido.';
            } else if (backendMsg.includes('expirado')) {
              message = 'El código ha expirado.';
            } else {
              message = backendMsg || 'Solicitud incorrecta.';
            }
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

      this.authService.sendCodeAgain(email).subscribe({
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


    /** Pone a cero el temporizador y deshabilita el botón */
    private startCountdown(): void {
      this.countdownSub?.unsubscribe();
      this.resendDisabled = true;
      this.secondsLeft = 120; // 2 minutos

      this.countdownSub = interval(1000).pipe(
        takeWhile(() => this.secondsLeft > 0)
      ).subscribe(() => {
        this.secondsLeft--;
        if (this.secondsLeft === 0) {
          this.resendDisabled = false;
        }
      });
    }

    /** Getter para mostrar mm:ss */
    get formattedTime(): string {
      const mm = Math.floor(this.secondsLeft / 60)
        .toString()
        .padStart(2, '0');
      const ss = (this.secondsLeft % 60).toString().padStart(2, '0');
      return `${mm}:${ss}`;
    }

    /**
     * Cada vez que escribes en un input:
     * - Filtra a dígito y maxlength=1
     * - Si hay valor, auto-avanza el foco
     */
    onCodeInput(event: Event, idx: number): void {
      const input = event.target as HTMLInputElement;
      const onlyDigit = input.value.replace(/\D/g, '').slice(0, 1);

      // Accedemos al control dinámicamente pero con el tipo correcto
      const controlName = `digit${idx}` as keyof typeof this.verificationForm.controls;
      this.verificationForm.controls[controlName].setValue(onlyDigit, { emitEvent: false });

      if (onlyDigit && idx < this.digitInputs.length - 1) {
        // Mover foco al siguiente
        this.digitInputs.toArray()[idx + 1].nativeElement.focus();
      }
    }
  }
