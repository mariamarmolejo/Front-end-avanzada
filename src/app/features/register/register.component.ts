// register.component.ts
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import mapboxgl from 'mapbox-gl';
import { NgIf } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { UserRegistration } from '../../core/models/users/user-registration.model';
import { NotificationService } from '../../core/services/Notification.service';
import { RouterModule } from '@angular/router'; // <-- IMPORTA ESTO
import { Router } from '@angular/router';
import { UserResponse } from '../../core/models/users/user-response.model';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    ReactiveFormsModule,
    RouterModule, // <-- AGREGA ESTO
    MatIconModule
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
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,  // inyecta el servicio
    private notificationService: NotificationService,
    private router: Router,
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.minLength(8), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.pattern('^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).*$'), Validators.minLength(8), Validators.maxLength(50)]],
      dateBirth: ['', [Validators.required, this.pastDateValidator()]],
      cityOfResidence: ['', Validators.required],
      notificationRadiusKm: [null, Validators.required],
      latitude: [null],
      longitude: [null]
    });
  }

   /** Helper para chequear un error concreto en un control */
   hasError(controlName: string, errorName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!(control && control.touched && control.hasError(errorName));
  }

  ngOnInit() {
  }

  ngAfterViewInit() {}

  continueToMap() {
    if (this.registerForm.valid) {
      this.isLoadingMap = true;
      this.showMap = true;

      const city = this.registerForm.get('cityOfResidence')!.value;
      this.getCityCoordinates(city)
        .then(coords => {
          // Una vez tengas coords, pásalas a initializeMap
          this.initializeMap(coords);
        })
        .catch(err => {
          this.notificationService.error('No pudimos encontrar tu ciudad. Por favor revisa el nombre.');
          this.showMap = false;
        })
        .finally(() => {
          this.isLoadingMap = false;
        });
    }
  }


  initializeMap(center: { lng: number; lat: number } = { lng: -75.681, lat: 4.533 }) {
    this.map = new mapboxgl.Map({
      container: 'map_user',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [center.lng, center.lat],
      zoom: 12,
      attributionControl: false,
      accessToken : environment.mapboxToken
    });

    this.map.on('load', () => {
      this.map.resize();
      this.isLoadingMap = false;
    });

    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

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


  /**
 * Llama al Geocoding API de Mapbox para obtener coordenadas
 * de la ciudad ingresada.
 */
private getCityCoordinates(city: string): Promise<{ lng: number; lat: number }> {
  const encoded = encodeURIComponent(city + ", Colombia");
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json`
            + `?access_token=${environment.mapboxToken}&limit=1`;
  return fetch(url)
    .then(resp => resp.json())
    .then(data => {
      if (!data.features || data.features.length === 0) {
        throw new Error('No se encontró la ciudad');
      }
      const [lng, lat] = data.features[0].center;
      return { lng, lat };
    });
}


  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitting) return; // evita doble clic

    this.isSubmitting = true;

    const data = this.registerForm.value as UserRegistration;

    if (data.latitude == null || data.longitude == null) {
      this.notificationService.error('Por favor selecciona una ubicación.');
      this.isSubmitting = false; // desbloquea el botón
      return;
    }

    this.authService.register(data).subscribe({
      next: (response: UserResponse) => {
        sessionStorage.setItem("Email", response.email);
        sessionStorage.setItem("UserId", response.id);
        this.notificationService.success('¡Registro exitoso!');
        this.router.navigate(['/validate-account']);
      },
      error: err => {
        const status = err.status;
        let message = 'Ocurrió un error. Intenta de nuevo.';

        if (status === 400) message = err.error?.message || 'Datos inválidos.';
        else if (status === 409) message = 'El correo ya está registrado.';
        else if (status === 500) message = 'Error interno del servidor.';

        this.notificationService.error(message);
        this.showMap = false; // <-- regresar al formulario
        this.isSubmitting = false;
      }
    });
  }


    /** Permite retroceder al paso de inputs */
    backToForm(): void {
      this.showMap = false;
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

  private pastDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null; // Dejar que Validators.required maneje el vacío
      }
      const date = new Date(value);
      const today = new Date();
      // Poner hora a 00:00 para comparar sólo fechas
      today.setHours(0, 0, 0, 0);
      if (date > today) {
        return { futureDate: true };
      }
      return null;
    };
  }

  goBack(): void {
    history.back();
  }

}
