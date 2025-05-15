import { Component, inject, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { saveAs } from 'file-saver';
import { CategoryService } from '../../core/services/category.service';
import { Category } from '../../core/models/category.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl } from '@angular/forms';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import * as turf from '@turf/turf';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment.prod';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-report-pdf-generator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './report-summary.component.html',
  styleUrls: ['./report-summary.component.css']
})
export class ReportPdfGeneratorComponent implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private categoryService = inject(CategoryService);
  private snackBar = inject(MatSnackBar);

  loading = false;
  categories: Category[] = [];
  loadingCategories = false;
  map!: mapboxgl.Map;
  radiusMarker: mapboxgl.Marker | null = null;
  isMapInitialized = false;
  private router = inject(Router)

  filterForm = this.fb.group({
    startDate: new FormControl<Date | null>(null),
    endDate: new FormControl<Date | null>(null),
    categoryIds: new FormControl<string[]>([], {
      validators: [Validators.minLength(1)]
    }),
    centerLat: new FormControl<number | null>(null, {
      validators: [Validators.min(-90), Validators.max(90)]
    }),
    centerLng: new FormControl<number | null>(null, {
      validators: [Validators.min(-180), Validators.max(180)]
    }),
    radiusKm: new FormControl<number | null>(null, {
      validators: [Validators.min(0)]
    })
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  initializeMap(): void {

    const storedLat = sessionStorage.getItem('lat');
    const storedLng = sessionStorage.getItem('lng');

    // 2) Decide centro y zoom según si hay coords guardadas
    let centerCoords: mapboxgl.LngLatLike;
    let initialZoom: number;

    if (storedLat && storedLng) {
        // Hay coords en sesión → úsalas
        centerCoords = {
            lng: parseFloat(storedLng),
            lat: parseFloat(storedLat)
        };
        initialZoom = 13;
    } else {
        // No hay nada → usa Armenia por defecto
        centerCoords = { lng: -75.681, lat: 4.533 };
        initialZoom = 13;
    }

    // Configuración inicial del mapa
    this.map = new mapboxgl.Map({
      accessToken: environment.mapboxToken,
      container: 'map-container',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: centerCoords, // Centro inicial (puedes ajustarlo)
      zoom: 13
    });

    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    this.map.on('load', () => {
      this.isMapInitialized = true;
      this.setupRadiusSelection();
    });

    // Si ya hay valores en el formulario, actualiza el mapa
    if (this.filterForm.value.centerLat && this.filterForm.value.centerLng) {
      this.updateMapWithCurrentValues();
    }
  }

  setupRadiusSelection(): void {
    let isDragging = false;
    let currentRadius = this.filterForm.value.radiusKm || 5; // Radio inicial en km

    // Evento para seleccionar el centro
    this.map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      
      this.filterForm.patchValue({
        centerLng: lng,
        centerLat: lat,
        radiusKm: currentRadius
      });

      this.drawRadiusCircle([lng, lat], currentRadius);
    });

    // Evento para arrastrar y cambiar el radio
    this.map.on('mousedown', () => {
      isDragging = true;
    });

    this.map.on('mouseup', () => {
      isDragging = false;
    });

    this.map.on('mousemove', (e) => {
      if (!isDragging || !this.radiusMarker) return;

      const center = this.radiusMarker.getLngLat();
      const newRadius = turf.distance(
        [center.lng, center.lat],
        [e.lngLat.lng, e.lngLat.lat],
        { units: 'kilometers' }
      );

      currentRadius = Math.max(0.1, newRadius); // Radio mínimo de 0.1 km
      
      this.filterForm.patchValue({
        radiusKm: currentRadius
      });

      this.drawRadiusCircle([center.lng, center.lat], currentRadius);
    });
  }

  drawRadiusCircle(center: [number, number], radiusKm: number): void {
    // Eliminar elementos existentes
    if (this.map.getLayer('radius-fill')) {
      this.map.removeLayer('radius-fill');
    }
    if (this.map.getLayer('radius-outline')) {
      this.map.removeLayer('radius-outline');
    }
    if (this.map.getSource('radius')) {
      this.map.removeSource('radius');
    }

    if (this.radiusMarker) {
      this.radiusMarker.remove();
    }

    // Crear círculo
    const circle = turf.circle(center, radiusKm, {
      steps: 64,
      units: 'kilometers'
    });

    this.map.addSource('radius', {
      type: 'geojson',
      data: circle
    });

    this.map.addLayer({
      id: 'radius-fill',
      type: 'fill',
      source: 'radius',
      paint: {
        'fill-color': '#4285F4',
        'fill-opacity': 0.2
      }
    });

    this.map.addLayer({
      id: 'radius-outline',
      type: 'line',
      source: 'radius',
      paint: {
        'line-color': '#4285F4',
        'line-width': 2
      }
    });

    // Crear marcador en el centro
    this.radiusMarker = new mapboxgl.Marker({
      draggable: true,
      color: '#4285F4'
    })
      .setLngLat(center)
      .addTo(this.map);

    // Evento para arrastrar el centro
    this.radiusMarker.on('drag', () => {
      const newCenter = this.radiusMarker!.getLngLat();
      this.filterForm.patchValue({
        centerLng: newCenter.lng,
        centerLat: newCenter.lat
      });
      this.drawRadiusCircle([newCenter.lng, newCenter.lat], radiusKm);
    });
  }

  updateMapWithCurrentValues(): void {
    if (!this.isMapInitialized) return;

    const { centerLat, centerLng, radiusKm } = this.filterForm.value;
    if (centerLat && centerLng) {
      const center: [number, number] = [centerLng, centerLat];
      this.map.flyTo({
        center,
        zoom: 12
      });

      if (radiusKm) {
        this.drawRadiusCircle(center, radiusKm);
      }
    }
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.categoryService.getAllActiveCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loadingCategories = false;
      },
      error: (err) => {
        console.error('Error cargando categorías', err);
        this.snackBar.open('Error al cargar categorías', 'Cerrar', {
          duration: 3000
        });
        this.loadingCategories = false;
      }
    });
  }

  toggleCategory(categoryId: string): void {
    const control = this.filterForm.get('categoryIds');
    const current: string[] = control?.value || [];

    const index = current.indexOf(categoryId);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(categoryId);
    }

    control?.setValue([...current]);
  }

  isSelected(categoryId: string): boolean {
    const value: string[] = this.filterForm.get('categoryIds')?.value || [];
    return value.includes(categoryId);
  }

  generateReport() {
    if (this.filterForm.invalid) return;

    this.loading = true;
    const formValue = this.filterForm.value;

    const filter = {
      startDate: formValue.startDate ? new Date(formValue.startDate).toISOString() : null,
      endDate: formValue.endDate ? new Date(formValue.endDate).toISOString() : null,
      categoryIds: formValue.categoryIds || [],
      center: (formValue.centerLat && formValue.centerLng) ? 
        { type: 'Point', coordinates: [formValue.centerLng, formValue.centerLat] } : null,
      radiusKm: formValue.radiusKm || null
    };

    // Eliminar propiedades nulas
    const cleanFilter = Object.fromEntries(
      Object.entries(filter).filter(([_, v]) => v !== null)
    );

    this.http.post(`${environment.urlBack}/admin/reportSummaries/pdf`, cleanFilter, {
      params: { page: 1, size: 20 },
      responseType: 'arraybuffer',
      withCredentials: true
    }).subscribe({
      next: (pdfData: ArrayBuffer) => {
        const blob = new Blob([pdfData], { type: 'application/pdf' });
        saveAs(blob, `reporte_${new Date().toISOString().split('T')[0]}.pdf`);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error generando PDF', err);
        this.snackBar.open('Error generando PDF', 'Cerrar', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/map']);
  }

  /**
 * Resetea todos los filtros al estado inicial
 * y remueve el círculo y marcador del mapa si existen.
 */
clearFilters(): void {
  // 1) Resetear el formulario
  this.filterForm.reset({
    startDate: null,
    endDate: null,
    categoryIds: [],
    centerLat: null,
    centerLng: null,
    radiusKm: null
  });

  // 2) Si el mapa ya está inicializado, elimina layers, source y marcador
  if (this.isMapInitialized) {
    // remover capas
    ['radius-fill', 'radius-outline'].forEach(layerId => {
      if (this.map.getLayer(layerId)) this.map.removeLayer(layerId);
    });
    // remover fuente
    if (this.map.getSource('radius')) {
      this.map.removeSource('radius');
    }
    // remover marcador
    if (this.radiusMarker) {
      this.radiusMarker.remove();
      this.radiusMarker = null;
    }
  }
}

}