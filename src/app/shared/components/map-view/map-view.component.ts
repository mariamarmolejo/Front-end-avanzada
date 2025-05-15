import {Component, EventEmitter, inject, OnDestroy, OnInit, Output, PLATFORM_ID} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common'; // Importa CommonModule para *ngFor y *ngIf
import {environment} from '../../../../environments/environment';
import mapboxgl from 'mapbox-gl';
import {ReportService} from "../../../core/services/report.service";
import {Report} from "../../../core/models/report.model";
import {AuthService} from '../../../core/services/auth.service';
import * as turf from '@turf/turf';
import {ReportCategoriesFilterComponent} from "./report-categories-filter/report-categories-filter.component";
import {ReportDetailsOverlayComponent} from "./report-details-overlay/report-details-overlay.component";

@Component({
    selector: 'app-map-view',
    standalone: true,
    imports: [CommonModule, ReportCategoriesFilterComponent, ReportDetailsOverlayComponent], // Añade CommonModule aquí
    templateUrl: './map-view.component.html',
    styleUrls: ['./map-view.component.css']
})
export class MapViewComponent implements OnInit, OnDestroy {
    mapa!: mapboxgl.Map;
    markers: mapboxgl.Marker[] = [];
    private platformId = inject(PLATFORM_ID);

    allReports: Report[] = [];
    selectedReport: Report | null = null;

    @Output() reportClicked = new EventEmitter<Report>();

    constructor(private reportService: ReportService, private authService: AuthService) {
    }

    ngOnInit(): void {

        this.reportService.reports$.subscribe((reports) => {
            this.allReports = reports;
            this.loadImage();
        });
        // 1. Obtener usuario y guardar coords
        this.authService.getCurrentUser().subscribe({
            next: user => {
                this.loadReports();

                // 3. Inicializar mapa
                if (isPlatformBrowser(this.platformId)) {
                    this.initializeMap([user.longitude, user.latitude]);
                }
            },
            error: () => {
                // fallback a ubicación fija
                const defaultCenter: [number, number] = [-75.681, 4.533];
                this.loadReports();
                if (isPlatformBrowser(this.platformId)) {
                    this.initializeMap(defaultCenter);
                }
            }
        });
        this.reportService.selectedReport$.subscribe((reports) => {
            this.selectedReport = reports;
            if (reports) {
                this.flyToReport(reports);
            }
        })
    }

    ngOnDestroy(): void {
        this.mapa?.remove();
    }


    private loadReports(): void {
        this.reportService.getReports().subscribe({
            error: err => console.error('Error reportes', err)
        });
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
            this.mapa.resize();
            this.updateMarkers(this.allReports);
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

    updateMarkers(filteredReports: Report[]): void {
        if (!this.mapa) return;
        this.clearMarkers();
        if (!this.mapa || !this.mapa.isStyleLoaded()) {
            console.warn('Map is not ready yet. Skipping marker update.');
            // Optionally, you could queue this update or re-attempt after the map 'load' event.
            return;
        }

        filteredReports.forEach(report => {
            // Crear popup
            const popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnMove: true,
                anchor: 'bottom',
                offset: [0, -20]
              }).setHTML(`
                <div class="report-popup">
                  <div class="popup-content">
                    <div class="popup-image">
                      <img src="${
                        report.images && report.images.length > 0
                          ? report.images[0].imageUrl
                          : 'placeholder.png'
                      }" alt="${report.title}" />
                    </div>
                    <div class="popup-info">
                      <h6 class="popup-title">${report.title}</h6>
                      <p class="popup-votes">${report.importantVotes} votos</p>
                    </div>
                  </div>
                </div>
              `);              
            const marker = new mapboxgl.Marker()
                .setLngLat([report.longitude, report.latitude])
                .setDraggable(false)
                .setPopup(popup)
                .addTo(this.mapa);
            marker.getElement().addEventListener('mouseenter', () => {
                popup.addTo(this.mapa)
            });
            marker.getElement().addEventListener('mouseleave', () => {
                popup.remove()
            });

            marker.getElement().addEventListener('click', () => {
                this.selectedReport = report;
            });
            this.markers.push(marker);
        });

    }

    public flyToReport(report: Report): void {
        if (report) {
            this.mapa.flyTo({
                center: [report.longitude, report.latitude],
                zoom: 15,
                essential: true
            });
        }
    }

    searchAddress(query: string): void {
        // Implementa tu lógica de geocoding si quieres
        console.log('Buscar dirección:', query);
    }

    loadImage(): void {
        for (const report of this.allReports) {
            if (report.id) {
                this.reportService.getAllImagesReportById(report.id).subscribe({
                    next: (images) => {
                        if (images.length > 0 && report) {
                            report.images = images;
                        }
                    }
                });
            }
        }
    }
}