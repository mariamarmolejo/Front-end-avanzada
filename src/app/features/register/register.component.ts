import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, AfterViewInit {
  registerForm: FormGroup;
  showMap = false;
  isLoadingMap = false;
  map!: mapboxgl.Map;
  marker!: mapboxgl.Marker;

  constructor(private fb: FormBuilder) {
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
    mapboxgl.accessToken = environment.mapboxToken;
  }

  ngAfterViewInit() {
    // Esto no hace nada ahora, pero si quieres modularizar más adelante, aquí puede ir
  }

  continueToMap() {
    if (this.registerForm.valid) {
      this.isLoadingMap = true;
      this.showMap = true;
      // Espera a que Angular renderice el contenedor del mapa
      setTimeout(() => this.initializeMap(), 50);
    }
  }
  
  initializeMap() {
    this.map = new mapboxgl.Map({
      container: 'map_user',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-75.681, 4.533],
      zoom: 13,
      attributionControl: false
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

  onRegister() {
    if (this.registerForm.valid) {
      console.log(this.registerForm.value);
      alert('Registro exitoso');
    } else {
      alert('Faltan datos de ubicación');
    }
  }

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
