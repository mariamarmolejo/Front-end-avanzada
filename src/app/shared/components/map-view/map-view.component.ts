import {
    afterNextRender,
    AfterRenderPhase,
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    inject,
    NgZone,
    OnDestroy,
    OnInit,
    PLATFORM_ID
} from '@angular/core';
import {CommonModule, isPlatformBrowser, NgFor, NgIf} from '@angular/common'; // Importa CommonModule para *ngFor y *ngIf
import {environment} from '../../../../environments/environment';
import mapboxgl, {Marker} from 'mapbox-gl';
import {CategoryService} from "../../../core/services/category.service";
import {Category} from "../../../core/models/category.model";
import {ReportService} from "../../../core/services/report.service";
import {Report} from "../../../core/models/report.model";
import { AuthService } from '../../../core/services/auth.service';
import * as turf from '@turf/turf';
import {Router} from "@angular/router"; // Asegúrate de importar Marker

@Component({
    selector: 'app-map-view',
    standalone: true,
    imports: [CommonModule, NgFor, NgIf], // Añade CommonModule aquí
    templateUrl: './map-view.component.html',
    styleUrls: ['./map-view.component.css']
})
export class MapViewComponent implements OnInit, OnDestroy {
    mapa!: mapboxgl.Map;
    markers: mapboxgl.Marker[] = [];
    private platformId = inject(PLATFORM_ID);
  
    categories: Category[] = [];
    allReports: Report[] = [];
    filteredReports: Report[] = [];
    selectedCategory = '';
  
    constructor(
      private cdRef: ChangeDetectorRef,
      private categoryService: CategoryService,
      private reportService: ReportService,
      private authService: AuthService,
      private router: Router
    ) {}
  
    ngOnInit(): void {
      // 1. Obtener usuario y guardar coords
      this.authService.getCurrentUser().subscribe({
        next: user => {
          sessionStorage.setItem('lat', user.latitude.toString());
          sessionStorage.setItem('lng', user.longitude.toString());
          sessionStorage.setItem('radiusKm', user.notificationRadiusKm.toString());
  
          // 2. Cargar datos
          this.loadCategories();
          this.loadReports();
  
          // 3. Inicializar mapa
          if (isPlatformBrowser(this.platformId)) {
            this.initializeMap([user.longitude, user.latitude]);
          }
        },
        error: () => {
          // fallback a ubicación fija
          const defaultCenter: [number, number] = [-75.681, 4.533];
          this.loadCategories();
          this.loadReports();
          if (isPlatformBrowser(this.platformId)) {
            this.initializeMap(defaultCenter);
          }
        }
      });
    }
  
    ngOnDestroy(): void {
      this.mapa?.remove();
    }
  
    private loadCategories(): void {
      this.categoryService.getAllActiveCategories().subscribe({
        next: cats => (this.categories = cats),
        error: err => console.error('Error categorías', err)
      });
    }
  
    private loadReports(): void {
      this.reportService.getReports().subscribe({
        next: res => {
          this.allReports = res.content;
          this.filteredReports = [...this.allReports];
          this.updateMarkers();
        },
        error: err => console.error('Error reportes', err)
      });
    }
  
    filterReports(category: string): void {
      this.selectedCategory = category;
      if (category) {
        this.filteredReports = this.allReports.filter(r =>
          r.categoryList?.some(cat => cat.name === category)
        );
      } else {
        this.filteredReports = [...this.allReports];
      }
      this.updateMarkers();
    }
  
    initializeMap(center: [number, number]): void {
      if (this.mapa) return;
  
      this.mapa = new mapboxgl.Map({
        accessToken: environment.mapboxToken,
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center,
        zoom: 12
      });

      this.addUserMarker(center);
  
      // Controles en bottom-right
      this.mapa.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
      this.mapa.addControl(new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
      }));
  
      this.mapa.on('load', () => {
        this.updateMarkers();
        this.drawUserRadius(center);
      });
  
      this.mapa.on('error', e => console.error('Mapbox error', e));
    }
  
    private drawUserRadius(center: [number, number]): void {
      const radiusKm = parseFloat(sessionStorage.getItem('radiusKm') || '1');
      const circle = turf.circle(center, radiusKm, {
        steps: 64,
        units: 'kilometers'
      });
  
      if (this.mapa.getSource('user-radius')) {
        (this.mapa.getSource('user-radius') as mapboxgl.GeoJSONSource).setData(circle as any);
      } else {
        this.mapa.addSource('user-radius', {
          type: 'geojson',
          data: circle as any
        });
        this.mapa.addLayer({
          id: 'user-radius-fill',
          type: 'fill',
          source: 'user-radius',
          paint: {
            'fill-color': '#007BFF',
            'fill-opacity': 0.15
          }
        });
        this.mapa.addLayer({
          id: 'user-radius-outline',
          type: 'line',
          source: 'user-radius',
          paint: {
            'line-color': '#007BFF',
            'line-width': 2
          }
        });
      }
    }

    private addUserMarker(coord: [number, number]) {
      const el = document.createElement('div');
      el.className = 'user-marker';
      el.style.backgroundImage = 'url(user.ico)'; // Usa una imagen personalizada
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.backgroundSize = 'contain';
  
      new mapboxgl.Marker(el)
        .setLngLat(coord)
        .setPopup(new mapboxgl.Popup().setText('Tu ubicación'))
        .addTo(this.mapa);
    }
  
    private clearMarkers(): void {
      this.markers.forEach(m => m.remove());
      this.markers = [];
    }
  
    private updateMarkers(): void {
      if (!this.mapa) return;
  
      this.clearMarkers();
  
      this.filteredReports.forEach(report => {
        const marker = new mapboxgl.Marker()
          .setLngLat([report.longitude, report.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <h6>${report.title}</h6>
                <p>${report.description}</p>
              `)
          )
          .addTo(this.mapa);
  
        this.markers.push(marker);
      });
  
      this.cdRef.detectChanges();
    }
  
    flyToReport(report: Report): void {
      this.mapa.flyTo({
        center: [report.longitude, report.latitude],
        zoom: 15,
        essential: true
      });
    }
  
    editReport(reportId: string | undefined): void {
      if (reportId) {
        this.router.navigate(['/report/edit', reportId]);
      }
    }
  
    searchAddress(query: string): void {
      // Implementa tu lógica de geocoding si quieres
      console.log('Buscar dirección:', query);
    }
  }