import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    inject,
    OnDestroy,
    OnInit,
    PLATFORM_ID
} from '@angular/core';
import {CommonModule, isPlatformBrowser, NgFor, NgIf} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import mapboxgl, {LngLat, LngLatLike} from 'mapbox-gl';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Subscription} from 'rxjs';
import {Category} from "../../core/models/category.model";
import {ReportService} from "../../core/services/report.service";
import {CategoryService} from "../../core/services/category.service";
import {environment} from "../../../environments/environment";
import {ReportRequest} from "../../core/models/report-request.model";
import {Report} from '../../core/models/report.model';


@Component({
    selector: 'app-report',
    standalone: true,
    imports: [
        CommonModule,
        NgIf,
        NgFor,
        ReactiveFormsModule,
        RouterModule
    ],
    templateUrl: './report.component.html',
    styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit, AfterViewInit, OnDestroy {
    reportForm: FormGroup;
    categories: Category[] = [];
    file: File | null = null;
    imagePreview: string | null = null;
    map!: mapboxgl.Map;
    marker!: mapboxgl.Marker;
    isLoading = false;
    isEditMode = false;
    reportId: string | null = null;
    private routeSub: Subscription | null = null;
    private initialReportData: Report | null = null; // Para modo edición
    private platformId = inject(PLATFORM_ID); // Inyecta PLATFORM_ID


    constructor(private fb: FormBuilder,
                private reportService: ReportService,
                private categoryService: CategoryService,
                private snackBar: MatSnackBar,
                private router: Router,
                private route: ActivatedRoute,
                private http: HttpClient,
                private cdRef: ChangeDetectorRef) {
        this.reportForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
            description: ['', [Validators.required, Validators.minLength(10)]],
            // Usaremos un FormControl simple para el select múltiple,
            // la conversión a CategoryRef[] se hará al enviar.
            categoryIds: ['', [Validators.required, Validators.minLength(1)]],
            latitude: [null, Validators.required],
            longitude: [null, Validators.required],
            selectedFile: [null, Validators.required]
        });

    }

    ngOnInit(): void {
        this.loadCategories();

        // Revisar si estamos en modo edición
        this.routeSub = this.route.paramMap.subscribe(params => {
            this.reportId = params.get('id');
            if (this.reportId) {
                this.isEditMode = true;
                this.loadReportForEdit(this.reportId);
            } else {
                this.isEditMode = false;
                console.log("No hay ID de reporte, modo creación.");

                // Pequeño retraso para asegurar que el div del mapa exista
                setTimeout(() => this.initializeMap(), 100);
            }
        });
    }

    ngAfterViewInit(): void {
        // La inicialización del mapa se maneja en ngOnInit o después de cargar datos de edición
    }

    ngOnDestroy(): void {
        this.routeSub?.unsubscribe();
        this.map?.remove(); // Limpia el mapa al destruir
    }

    loadCategories(): void {
        this.categoryService.getAllActiveCategories().subscribe({
            next: (cats) => this.categories = cats,
            error: (err) => this.snackBar.open('Error al cargar categorías.', 'Cerrar', {duration: 3000})
        });
    }

    loadReportForEdit(id: string): void {
        this.isLoading = true;
        this.reportService.getReportById(id).subscribe({
            next: (report) => {
                this.initialReportData = report;
                this.reportForm.patchValue({
                    title: report.title,
                    description: report.description,
                    categoryIds: report.categoryList.map(cat => cat.id), // Poblar IDs para el select
                    latitude: report.latitude,
                    longitude: report.longitude
                });
                // Poblar previsualizaciones de imágenes existentes (simplificado)  TODO
                //this.imagePreview = report.images.map(img => img.url);
                this.isLoading = false;
                // Inicializar mapa DESPUÉS de tener lat/lng
                setTimeout(() => this.initializeMap([report.longitude, report.latitude]), 100);
            },
            error: (err) => {
                this.isLoading = false;
                this.snackBar.open('Error al cargar el reporte para editar.', 'Cerrar', {duration: 3000});
                this.router.navigate(['/map']); // O a donde corresponda
            }
        });
    }

    initializeMap(initialCoords?: [number, number]): void {
        if (this.map) return;
        if (!isPlatformBrowser(this.platformId))
            return;
        const centerCoords: LngLatLike = initialCoords
            ? {lng: initialCoords[0], lat: initialCoords[1]}
            : {lng: -75.681, lat: 4.533}; // Armenia por defecto
        const initialZoom = initialCoords ? 16 : 13;

        try {
            this.map = new mapboxgl.Map({
                accessToken: environment.mapboxToken,
                container: 'map_user', // ID del div en el HTML
                style: 'mapbox://styles/mapbox/streets-v11',
                center: centerCoords,
                zoom: initialZoom,
                attributionControl: false
            });

            this.map.on('load', () => {
                this.map.resize();
                console.log('Mapa cargado (report form).');
                // Si hay coordenadas iniciales (edición o búsqueda previa), colocar marcador
                if (this.reportForm.get('latitude')?.value && this.reportForm.get('longitude')?.value) {
                    const initialLngLat = new LngLat(
                        this.reportForm.get('longitude')?.value,
                        this.reportForm.get('latitude')?.value
                    );
                    this.updateMarkerAndForm(initialLngLat);
                }
            });

            this.map.on('click', ({lngLat}) => {
                this.updateMarkerAndForm(lngLat);
            });

            this.map.on('error', (e) => {
                console.error('Error en Mapbox (report form):', e);
                this.snackBar.open('Error al cargar el mapa.', 'Cerrar', {duration: 3000});
            });


        } catch (error) {
            console.error("Error inicializando Mapbox (report form):", error);
        }
    }

    searchAddress(query: string): void {
        if (!query || !this.map) return;

        const mapboxToken = environment.mapboxToken;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
        const params = new HttpParams()
            .set('access_token', mapboxToken)
            .set('country', 'CO')
            .set('proximity', '-75.681,4.533')
            .set('limit', '1');

        this.http.get<any>(url, {params}).subscribe({
            next: (data) => {
                if (data.features && data.features.length > 0) {
                    const [lng, lat] = data.features[0].center;
                    const lngLat = new LngLat(lng, lat);
                    this.map.flyTo({center: lngLat, zoom: 16});
                    this.updateMarkerAndForm(lngLat);
                } else {
                    this.snackBar.open('Dirección no encontrada.', 'Cerrar', {duration: 3000});
                }
            },
            error: (err) => {
                console.error('Error en Geocoding:', err);
                this.snackBar.open('Error al buscar la dirección.', 'Cerrar', {duration: 3000});
            }
        });
    }

    updateMarkerAndForm(lngLat: mapboxgl.LngLat): void {
        this.reportForm.patchValue({
            latitude: lngLat.lat,
            longitude: lngLat.lng
        });

        if (this.marker) {
            this.marker.setLngLat(lngLat);
        } else {
            this.marker = new mapboxgl.Marker({draggable: true})
                .setLngLat(lngLat)
                .addTo(this.map);

            this.marker.on('dragend', () => {
                const newLngLat = this.marker.getLngLat();
                this.reportForm.patchValue({
                    latitude: newLngLat.lat,
                    longitude: newLngLat.lng
                });
            });
        }
    }

    onFileSelected(event: Event): void {
        const element = event.currentTarget as HTMLInputElement;
        const fileList: FileList | null = element.files;
        this.imagePreview = null; // Limpiar previsualizaciones

        if (fileList && fileList.length > 0) {

            const file = fileList[0];
            this.file = fileList[0];

            if (!file.type.startsWith('image/')) {
                this.snackBar.open(`El archivo '${file.name}' no es una imagen válida.`, 'Cerrar', {duration: 3000});
            }

            // Generar previsualización
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imagePreview = e.target.result;
                this.cdRef.detectChanges(); // Forzar detección de cambios para la preview
            };
            reader.readAsDataURL(file);

        }
        // Limpiar el input para permitir seleccionar los mismos archivos de nuevo si es necesario
        element.value = '';
    }

    removePreview(index: number): void {
//        this.reportForm.selectedFile = null;
        this.imagePreview = null;
    }


    onSubmit(): void {
        if (this.reportForm.invalid) {
            this.reportForm.markAllAsTouched();
            this.snackBar.open('Por favor, completa todos los campos requeridos.', 'Cerrar', {duration: 3000});
            return;
        }

        // Validar imágenes (al menos una si es modo creación)
        if (!this.isEditMode && !this.file) {
            this.snackBar.open('Debes subir al menos una imagen para el reporte.', 'Cerrar', {duration: 3000});
            return;
        }
        // En modo edición, si no se suben nuevas fotos Y no había fotos antes O se borraron todas, validar.
        // (Esta validación podría ser más compleja dependiendo de si se permite editar sin cambiar fotos)


        this.isLoading = true;

        const formValue = this.reportForm.value;
        const reportRequest: ReportRequest = {
            title: formValue.title,
            description: formValue.description,
            latitude: formValue.latitude,
            longitude: formValue.longitude,
            categoryList: this.categories.filter(cat => formValue.categoryIds.includes(cat.id))
        };


        if (this.isEditMode && this.reportId) {
            // --- Lógica de Edición ---
            // Nota: La actualización de imágenes no está implementada aquí.
            // Necesitarías lógica adicional para enviar nuevas imágenes y/o IDs de imágenes a eliminar.
            this.reportService.updateReport(this.reportId, reportRequest).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.snackBar.open('Reporte actualizado con éxito.', 'Cerrar', {duration: 3000});
                    this.router.navigate(['/map']); // O a la lista de reportes
                },
                error: (err) => {
                    this.isLoading = false;
                    this.snackBar.open('Error al actualizar el reporte.', 'Cerrar', {duration: 3000});
                }
            });
        } else {
            // --- Lógica de Creación ---
            if (this.file) {
                this.reportService.createReport(reportRequest, this.file).subscribe({
                    next: (createdReport) => {
                        this.isLoading = false;
                        this.snackBar.open('Reporte creado con éxito. Pendiente de verificación.', 'Cerrar', {duration: 3000});
                        this.router.navigate(['/map']); // O a donde quieras redirigir
                    },
                    error: (err) => {
                        this.isLoading = false;
                        this.snackBar.open(err.message || 'Error al crear el reporte.', 'Cerrar', {duration: 5000});
                    }
                });
            }


        }
    }

    // Getters para validación fácil en la plantilla
    get title() {
        return this.reportForm.get('title');
    }

    get description() {
        return this.reportForm.get('description');
    }

    get categoryIds() {
        return this.reportForm.get('categoryIds');
    }

    get latitude() {
        return this.reportForm.get('latitude');
    }

    get longitude() {
        return this.reportForm.get('longitude');
    }

    get selectedFile() {
        return this.reportForm.get('selectedFile');
    }
}