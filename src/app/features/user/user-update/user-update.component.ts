import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/Notification.service';
import { Router } from '@angular/router';
import { UserResponse } from '../../../core/models/users/user-response.model';
import { MatIcon
 } from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    ReactiveFormsModule, MatIcon
  ],
  templateUrl: './user-update.component.html',
  styleUrls: ['./user-update.component.css']
})
export class UpdateProfileComponent implements OnInit, AfterViewInit {
  profileForm: FormGroup;
  showMap = false;
  isLoadingMap = false;
  map!: mapboxgl.Map;
  marker!: mapboxgl.Marker;
  isSubmitting = false;
  currentUser!: UserResponse;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.profileForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.minLength(8), Validators.maxLength(50)]],
      fullName: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(50)]],
      cityOfResidence: ['', Validators.required],
      notificationRadiusKm: [null, [Validators.required, Validators.min(1)]],
      latitude: [null, Validators.required],
      longitude: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  ngAfterViewInit() {
    if (this.currentUser?.latitude && this.currentUser?.longitude) {
      setTimeout(() => {
        this.showMap = true;
        this.initializeMap({ lng: this.currentUser.longitude, lat: this.currentUser.latitude });
        this.cdr.detectChanges();
      }, 0);
    }
  }

  private loadUserData() {
    this.authService.getMe().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.populateForm(user);
      },
      error: () => {
        this.notificationService.error('Error al cargar los datos del usuario');
        this.router.navigate(['/']);
      }
    });
  }

  private populateForm(user: UserResponse) {
    this.profileForm.patchValue({
      email: user.email,
      fullName: user.fullName,
      dateBirth: user.dateBirth,
      cityOfResidence: user.cityOfResidence,
      notificationRadiusKm: user.notificationRadiusKm,
      latitude: user.latitude,
      longitude: user.longitude
    });
  }

  /** Helper para chequear un error concreto en un control */
  hasError(controlName: string, errorName: string): boolean {
    const control = this.profileForm.get(controlName);
    return !!(control && control.touched && control.hasError(errorName));
  }

  /** Intenta geolocalizar la ciudad y mostrar mapa */
  continueToMap() {
    if (!this.profileForm.valid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const cityControl = this.profileForm.get('cityOfResidence')!;
    const newCity = cityControl.value;

    // Si el usuario no cambió la ciudad, simplemente mostramos el mapa con la ubicación existente
    if (newCity === this.currentUser.cityOfResidence) {
      this.showMap = true;
      this.isLoadingMap = false;
      this.cdr.detectChanges();
      setTimeout(() => {
        const lat = this.profileForm.get('latitude')!.value;
        const lng = this.profileForm.get('longitude')!.value;
        this.initializeMap({ lng, lat });
      }, 0);
      return;
    }

    this.isLoadingMap = true;
    this.showMap = true;
    this.cdr.detectChanges();

    console.log('Buscando coordenadas para:', newCity);
    this.getCityCoordinates(newCity)
      .then(coords => {
        setTimeout(() => this.initializeMap({ lng: coords.lng, lat: coords.lat }), 0);
      })
      .catch(err => {
        console.error('Error al obtener coordenadas:', err);
        const msg = err?.message === 'Ciudad no encontrada'
          ? 'No pudimos encontrar tu ciudad. Revisa el nombre.'
          : 'Ocurrió un error al cargar el mapa. Intenta nuevamente.';
        this.notificationService.error(msg);
        this.showMap = false;
      })
      .finally(() => this.isLoadingMap = false);
  }

  /** Inicializa el mapa en el contenedor #map_user */
  initializeMap(center: { lng: number; lat: number }) {
    console.log('Inicializando mapa con coords:', center);
    if (this.map) {
      this.map.remove();
      console.log('Mapa anterior eliminado');
    }

    this.map = new mapboxgl.Map({
      container: 'map_user',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [center.lng, center.lat],
      zoom: 12,
      accessToken: environment.mapboxToken
    });

    this.map.on('load', () => {
      this.map.resize();
      this.isLoadingMap = false;
    });

    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    this.map.on('click', ({ lngLat }) => this.onMapClick(lngLat));

    this.addMarker(center);
  }

  private onMapClick(lngLat: mapboxgl.LngLat) {
    this.updateLocation(lngLat);
    if (this.marker) {
      this.marker.setLngLat(lngLat);
    } else {
      this.addMarker({ lng: lngLat.lng, lat: lngLat.lat });
    }
  }

  private addMarker(coords: { lng: number; lat: number }) {
    if (this.marker) this.marker.remove();

    this.marker = new mapboxgl.Marker({ draggable: true, anchor: 'center' })
      .setLngLat([coords.lng, coords.lat])
      .addTo(this.map)
      .on('dragend', () => {
        const lngLat = this.marker.getLngLat();
        this.updateLocation(lngLat);
      });
  }

  /** Actualiza latitud y longitud en el formulario */
  private updateLocation(lngLat: mapboxgl.LngLat) {
    this.profileForm.patchValue({
      latitude: lngLat.lat,
      longitude: lngLat.lng
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

  onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const updateData = this.profileForm.value;

    this.authService.updateUser(this.currentUser.id, updateData).subscribe({
      next: (updatedUser) => {
        this.notificationService.success('Datos actualizados correctamente');
        this.currentUser = updatedUser;
        this.isSubmitting = false;
        this.goBack();
      },
      error: (err) => {
        const msg = err.error?.message || 'Error al actualizar los datos';
        this.notificationService.error(msg);
        this.populateForm(this.currentUser);
        this.isSubmitting = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/profile']);
  }
}
