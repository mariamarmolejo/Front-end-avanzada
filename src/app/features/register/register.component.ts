// register.component.ts
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import mapboxgl from 'mapbox-gl';
import { NgIf } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { UserRegistration } from '../../core/models/user-registration.model';
// Import de Material
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router'; // <-- IMPORTA ESTO
import { Router } from '@angular/router';



@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    ReactiveFormsModule,
    RouterModule, // <-- AGREGA ESTO
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, AfterViewInit {
  registerForm: FormGroup;
  showMap = false;
  isLoadingMap = false;
  map!: mapboxgl.Map;
  marker!: mapboxgl.Marker;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,  // inyecta el servicio
    private snackBar: MatSnackBar,
    private router: Router,
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.minLength(8), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.pattern('^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).*$')]],
      dateBirth: ['', [Validators.required]],
      cityOfResidence: ['', Validators.required],
      notificationRadiusKm: [null, Validators.required],
      latitude: [null],
      longitude: [null]
    });
  }

  ngOnInit() {
  }

  ngAfterViewInit() {}

  continueToMap() {
    if (this.registerForm.valid) {
      this.isLoadingMap = true;
      this.showMap = true;
      setTimeout(() => this.initializeMap(), 50);
    }
  }

  initializeMap() {
    this.map = new mapboxgl.Map({
      container: 'map_user',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-75.681, 4.533],
      zoom: 13,
      attributionControl: false,
      accessToken : environment.mapboxToken
    });

    this.map.on('load', () => {
      this.map.resize();
      this.isLoadingMap = false;
    });

    this.map.on('click', ({ lngLat }) => {
      this.registerForm.patchValue({
        latitude: lngLat.lat,
        longitude: lngLat.lng
      });

      if (this.marker) {
        this.marker.setLngLat(lngLat);
      } else {
        this.marker = new mapboxgl.Marker({ draggable: true, anchor: 'center' })
          .setLngLat(lngLat)
          .addTo(this.map);
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
  
    const data = this.registerForm.value as UserRegistration;
  
    // Validar que latitude y longitude no sean nulos o undefined
    if (data.latitude == null || data.longitude == null) {
      this.snackBar.open('Por favor selecciona una ubicación.', 'Cerrar', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snackbar-error']
      });
      return;
    }
  
    this.authService.register(data).subscribe({
      next: () => {
        this.snackBar.open('¡Registro exitoso!', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.router.navigate(['/validate-account']);
      },
      error: err => {
        const status = err.status;
        let message = 'Ocurrió un error. Intenta de nuevo.';
  
        if (status === 400)      message = err.error?.message || 'Datos inválidos.';
        else if (status === 409) message = 'El correo ya está registrado.';
        else if (status === 500) message = 'Error interno del servidor.';
  
        this.snackBar.open(message, 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    });
  }
  
  

  // getters de validación...
  // Validaciones
  get fullNameInvalid(): boolean {
    const control = this.registerForm.get('fullName');
    return !!(control && control.touched && control.invalid);
  }

  get emailInvalid(): boolean {
    const control = this.registerForm.get('email');
    return !!(control && control.touched && control.invalid);
  }

  get passwordInvalid(): boolean {
    const control = this.registerForm.get('password');
    return !!(control && control.touched && control.invalid);
  }

  get dateBirthInvalid(): boolean {
    const control = this.registerForm.get('dateBirth');
    return !!(control && control.touched && control.invalid);
  }

  get cityOfResidenceInvalid(): boolean {
    const control = this.registerForm.get('cityOfResidence');
    return !!(control && control.touched && control.invalid);
  }

  get notificationRadiusInvalid(): boolean {
    const control = this.registerForm.get('notificationRadiusKm');
    return !!(control && control.touched && (control.invalid || control.value <= 0));
  }
}