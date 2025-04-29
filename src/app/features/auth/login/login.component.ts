import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgIf} from '@angular/common';
import {AuthService} from '../../../core/services/auth.service';
import {Router, RouterModule} from '@angular/router';

// Import de Material
import {MatSnackBar} from '@angular/material/snack-bar';
import {Subscription} from "rxjs";

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
export class LoginComponent implements OnInit, OnDestroy {
    private loginSubscription: Subscription | null = null;
    registerForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private snackBar: MatSnackBar       // ← inyecta el SnackBar
    ) {
        this.registerForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required]]
        });
    }

    ngOnInit(): void {
        // Verifica si el usuario ya está autenticado

        this.loginSubscription = this.authService.getAuthStatus().subscribe({
            next: (status) => {
                if (status) {
                    this.router.navigate(['/map']);
                } else {
                    this.router.navigate(['/login']);
                }
            }
        });

        console.log('Checking health...');

    }


    ngOnDestroy(): void {
        console.log("call ng ngOnDestroy");
        if (this.loginSubscription) {
            this.loginSubscription.unsubscribe();
        }
    }

    onLogin(): void {
        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        const {email, password} = this.registerForm.value;
        this.authService.login({email, password}).subscribe({
            next: () => {
                this.router.navigate(['/map']);
            },
            error: err => {
                // Determina mensaje según el status
                const status = err.status;
                let message = 'Ocurrió un error. Intenta de nuevo.';

                if (status === 400) message = err.error?.message || 'Campos inválidos.';
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

