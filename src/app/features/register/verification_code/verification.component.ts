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
    FormControl
  } from '@angular/forms';
  import { interval, Subscription } from 'rxjs';
  import { takeWhile } from 'rxjs/operators';
  import { Router } from '@angular/router';
  
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
      // Si quieres que al cargar ya empiece el temporizador,
      // descomenta la siguiente línea:
      // this.startCountdown();
    }
  
    ngOnDestroy(): void {
      this.countdownSub?.unsubscribe();
    }
  
    /** Al enviar, concatenamos los dígitos y mostramos alerta */
    submitCode(): void {
      if (this.verificationForm.valid) {
        const code = Object.values(this.verificationForm.value).join('');
        alert(`Código ingresado: ${code}`);
        // aquí podrías hacer:
        // this.authService.verifyCode(code).subscribe(...)
      }
    }
  
    /** Reenvía el código y reinicia el temporizador */
    resendCode(): void {
      if (this.resendDisabled) return;
      alert('Código reenviado');
      // aquí podrías hacer:
      // this.authService.resendVerificationCode().subscribe({...})
      this.startCountdown();
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
  