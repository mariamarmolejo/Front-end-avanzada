import {
    afterNextRender, AfterRenderPhase,
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    inject,
    OnDestroy,
    OnInit,
    PLATFORM_ID
} from '@angular/core';
import {CommonModule, isPlatformBrowser, NgFor, NgIf} from '@angular/common'; // Importa CommonModule para *ngFor y *ngIf
import {environment} from '../../../../environments/environment';
import mapboxgl, {Marker} from 'mapbox-gl';
import {CategoryService} from "../../../core/services/category.service";
import {Category} from "../../../core/models/category.model"; // Asegúrate de importar Marker

// Define una interfaz para tus reportes para mayor claridad
interface Report {
    id: number; // Añade un ID único si es posible
    nombre: string;
    category: string; // Añade la categoría
    lat: number;
    lng: number;
    marker?: Marker; // Para mantener una referencia al marcador del mapa
}

@Component({
    selector: 'app-map-view',
    standalone: true,
    imports: [CommonModule, NgFor, NgIf], // Añade CommonModule aquí
    templateUrl: './map-view.component.html',
    styleUrls: ['./map-view.component.css']
})
export class MapViewComponent implements AfterViewInit, OnDestroy, OnInit {
    mapa!: mapboxgl.Map;
    markers: Marker[] = []; // Almacenará los marcadores actuales en el mapa
    private platformId = inject(PLATFORM_ID); // Inyecta PLATFORM_ID

    // Datos de ejemplo con categoría e ID
    allReports: Report[] = [
        {id: 1, nombre: 'Perro perdido - Firulais', category: 'Mascota perdida', lat: 4.533, lng: -75.681},
        {id: 2, nombre: 'Intento de robo calle 10', category: 'Robo', lat: 4.535, lng: -75.683},
        {id: 3, nombre: 'Venta empanadas Parque Sucre', category: 'Venta', lat: 4.537, lng: -75.685},
        {id: 4, nombre: 'Zapatos en oferta Cra 14', category: 'Venta', lat: 4.539, lng: -75.687},
        {id: 5, nombre: 'Cierre vial por evento', category: 'Comunicado', lat: 4.541, lng: -75.689}
        // ... más reportes
    ];
    categories: Category[] = [];

    filteredReports: Report[] = []; // Los reportes que se muestran en la lista y mapa
    selectedCategory: string = ''; // La categoría seleccionada

    // Inyecta ChangeDetectorRef para notificar cambios cuando actualizas filteredReports
    constructor(private cdRef: ChangeDetectorRef, private categoryService: CategoryService) {

        afterNextRender(() => {
            // Asegúrate de que esto se ejecuta SOLO en el navegador
            if (isPlatformBrowser(this.platformId)) {
                console.log('afterNextRender: Initializing Mapbox');
                this.initializeMap();
            }
        }, { phase: AfterRenderPhase.Write }); // <-- USA EL ENUMERADOR
        // ---------------------------------------------
    }

    initializeMap() {
        if (this.mapa) return; // Evita reinicializar si ya existe

        // Verifica si el contenedor existe justo antes de crear el mapa
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error('Map container #map not found in DOM!');
            return;
        }
        console.log('Map container found, creating map instance...');


        this.mapa = new mapboxgl.Map({
            accessToken: environment.mapboxToken,
            container: 'map', // El ID del div en tu HTML
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-75.681, 4.533],
            zoom: 13
        });

        this.mapa.on('load', () => {
            console.log('Mapbox map loaded event fired');
            this.updateMarkers();
        });

        this.mapa.on('error', (e) => {
            console.error('Mapbox error:', e);
        });
    }

    ngOnInit(): void {
        this.loadCategories()// Obtiene las categorías
        this.filteredReports = [...this.allReports]; // Inicialmente mostrar todos

    }


    ngAfterViewInit() {
        console.log("inicio mapa" + this.mapa);
        console.log(environment.mapboxToken);
        this.mapa = new mapboxgl.Map({
            accessToken: environment.mapboxToken,
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-75.681, 4.533], // Centro inicial
            zoom: 13
        });

        this.mapa.on('load', () => {
            this.updateMarkers(); // Dibuja los marcadores iniciales
        });

    }

    ngOnDestroy() {
        // Limpia el mapa al destruir el componente para evitar fugas de memoria
        this.mapa?.remove();
    }

    // Actualiza la lista de reportes filtrados
    filterReports(category: string) {

        this.selectedCategory = category;
        if (!category) {
            this.filteredReports = [...this.allReports]; // Muestra todos si no hay categoría
        } else {
            this.filteredReports = this.allReports.filter(report => report.category === category);
        }
        this.updateMarkers(); // Actualiza los marcadores en el mapa
        this.cdRef.detectChanges(); // Notifica a Angular sobre el cambio en filteredReports
    }

    // Limpia marcadores existentes y añade los nuevos según el filtro
    updateMarkers() {
        // 1. Limpiar marcadores anteriores
        this.markers.forEach(marker => marker.remove());
        this.markers = []; // Vaciar el array

        // 2. Añadir marcadores para los reportes filtrados
        this.filteredReports.forEach(report => {
            const marker = new mapboxgl.Marker()
                .setLngLat([report.lng, report.lat])
                .setPopup(new mapboxgl.Popup().setHTML(`<h6>${report.nombre}</h6><p>${report.category}</p>`)) // Popup opcional
                .addTo(this.mapa);
            this.markers.push(marker); // Guarda la referencia
        });

        // Opcional: Ajustar el zoom para que encajen los marcadores filtrados
        if (this.filteredReports.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            this.filteredReports.forEach(report => {
                bounds.extend([report.lng, report.lat]);
            });
            this.mapa.fitBounds(bounds, {padding: 50, maxZoom: 15});
        } else if (this.allReports.length > 0) {
            // Si no hay filtros pero sí reportes, ajusta a todos
            const bounds = new mapboxgl.LngLatBounds();
            this.allReports.forEach(report => {
                bounds.extend([report.lng, report.lat]);
            });
            this.mapa.fitBounds(bounds, {padding: 50, maxZoom: 15});
        }
    }

    // Función para centrar el mapa en un reporte al hacer clic en la lista
    flyToReport(report: Report) {
        this.mapa.flyTo({
            center: [report.lng, report.lat],
            zoom: 15 // O el zoom que prefieras
        });
        // Opcional: Abrir el popup del marcador correspondiente
        const reportMarker = this.markers.find(m => {
            const markerLngLat = m.getLngLat();
            return markerLngLat.lng === report.lng && markerLngLat.lat === report.lat;
        });
        reportMarker?.togglePopup();
    }

    // Mantenemos la búsqueda por dirección si la necesitas
    searchAddress(query: string) {
        // Implementa la lógica para buscar direcciones usando el API de Mapbox Geocoding si es necesario
        console.log(`Buscando dirección: ${query}`);
        // Ejemplo (requiere llamar al API):
        // fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${environment.mapboxToken}`)
        //   .then(response => response.json())
        //   .then(data => {
        //     if (data.features && data.features.length > 0) {
        //       const [lng, lat] = data.features[0].center;
        //       this.mapa.flyTo({ center: [lng, lat], zoom: 14 });
        //     } else {
        //       alert('Dirección no encontrada');
        //     }
        //   });
    }

    loadCategories() {
        this.categoryService.getAllActiveCategories().subscribe({
            next: (categories) => {
                this.categories = categories;
                // Remove cuando se desee
                if (categories.length == 0) {
                    const category: Category = {name: 'Mascota perdida', description: 'Mascota perdido en la calle'};
                    this.categoryService.addCategory(category).subscribe(category => console.log(category.id)); // Filtra los reportes por la primera categoría
                    const category2: Category = {name: 'Robo', description: 'Robo armado'};
                    this.categoryService.addCategory(category2).subscribe(category => console.log(category.id)); // Filtra los reportes por la primera categoría
                    const category3: Category = {name: 'Venta', description: 'Venta de elmentos'};
                    this.categoryService.addCategory(category3).subscribe(category => console.log(category.id)); // Filtra los reportes por la primera categoría
                    const category4: Category = {name: 'Comunicado', description: 'Comunicados de la ciudad'};
                    this.categoryService.addCategory(category4).subscribe(category => console.log(category.id)); // Filtra los reportes por la primera categoría
                }
            },
            error: (error) => {
                console.error('Error al obtener categorías:', error);
            }
        });
    }
}