import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, NgFor, NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import mapboxgl, { LngLat, LngLatLike } from 'mapbox-gl';
import { Subscription } from 'rxjs';
import { Category } from "../../core/models/category.model";
import { ReportService } from "../../core/services/report.service";
import { CategoryService } from "../../core/services/category.service";
import { environment } from "../../../environments/environment";
import { ReportRequest } from "../../core/models/report-request.model";
import { Report } from '../../core/models/report.model';
import { NotificationService } from '../../core/services/Notification.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-report',
    standalone: true,
    imports: [
        CommonModule,
        NgIf,
        NgFor,
        ReactiveFormsModule,
        RouterModule,
        MatIconModule
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
    private notificationService = inject(NotificationService);


    constructor(private fb: FormBuilder,
        private reportService: ReportService,
        private categoryService: CategoryService,
        private snackBar: MatSnackBar,
        private router: Router,
        private route: ActivatedRoute,
        private cdRef: ChangeDetectorRef) {
        this.reportForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
            description: ['', [Validators.required, Validators.minLength(10)]],
            // Usaremos un FormControl simple para el select múltiple,
            // la conversión a CategoryRef[] se hará al enviar.
            categoryIds: [[], [Validators.required, Validators.minLength(1)]],
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
            error: (err) => this.notificationService.error("Error al cargar las categorías")
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

                this.reportForm.get('selectedFile')?.clearValidators();
                this.reportForm.get('selectedFile')?.updateValueAndValidity();

                // Poblar previsualizaciones de imágenes existentes (simplificado)
                this.loadImages(report.id);
                this.isLoading = false;
                // Inicializar mapa DESPUÉS de tener lat/lng
                setTimeout(() => this.initializeMap([report.longitude, report.latitude]), 100);
            },
            error: (err) => {
                this.isLoading = false;
                this.notificationService.error("Error al cargar el reporte para editar.")
                this.router.navigate(['/map']); // O a donde corresponda
            }
        });
    }

    initializeMap(initialCoords?: [number, number]): void {
        // 1) Intenta leer coords de sessionStorage
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
        } else if (initialCoords) {
            // Se pasó un initialCoords explícito (ej. en fallback de usuario)
            centerCoords = {
                lng: initialCoords[0],
                lat: initialCoords[1]
            };
            initialZoom = 13;
        } else {
            // No hay nada → usa Armenia por defecto
            centerCoords = { lng: -75.681, lat: 4.533 };
            initialZoom = 13;
        }

        try {
            this.map = new mapboxgl.Map({
                accessToken: environment.mapboxToken,
                container: 'map_user', // ID del div en el HTML
                style: 'mapbox://styles/mapbox/streets-v11',
                center: centerCoords,
                zoom: initialZoom,
                attributionControl: false
            });

            this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

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

            this.map.on('click', ({ lngLat }) => {
                if (!this.isEditMode)
                    this.updateMarkerAndForm(lngLat);
            });

            this.map.on('error', (e) => {
                console.error('Error en Mapbox (report form):', e);
                this.notificationService.error("Error al cargar el mapa.");
            });


        } catch (error) {
            console.error("Error inicializando Mapbox (report form):", error);
        }
    }

    updateMarkerAndForm(lngLat: mapboxgl.LngLat): void {
        this.reportForm.patchValue({
            latitude: lngLat.lat,
            longitude: lngLat.lng
        });

        if (this.marker) {
            this.marker.setLngLat(lngLat);
        } else {
            this.marker = new mapboxgl.Marker({ draggable: !this.isEditMode })
                .setLngLat(lngLat)
                .addTo(this.map);
            if (!this.isEditMode) {
                this.marker.on('dragend', () => {
                    const newLngLat = this.marker.getLngLat();
                    this.reportForm.patchValue({
                        latitude: newLngLat.lat,
                        longitude: newLngLat.lng
                    });
                });
            }
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
                this.notificationService.error(`El archivo '${file.name}' no es una imagen válida.`);
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
            this.snackBar.open('Por favor, completa todos los campos requeridos.', 'Cerrar', { duration: 3000 });
            return;
        }

        // Validar imágenes (al menos una si es modo creación)
        if (!this.isEditMode && !this.file) {
            this.snackBar.open('Debes subir al menos una imagen para el reporte.', 'Cerrar', { duration: 3000 });
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
            console.log(this.file)
            // --- Lógica de Edición ---
            // Nota: La actualización de imágenes no está implementada aquí.
            // Necesitarías lógica adicional para enviar nuevas imágenes y/o IDs de imágenes a eliminar.
            this.reportService.updateReport(this.reportId, reportRequest, this.file).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.notificationService.success("Reporte actualizado con éxito.");
                    this.router.navigate(['/map']); // O a la lista de reportes
                },
                error: (err) => {
                    this.isLoading = false;
                    this.notificationService.error('Error al actualizar el reporte.');
                }
            });
        } else {
            // --- Lógica de Creación ---
            if (this.file) {
                this.reportService.createReport(reportRequest, this.file).subscribe({
                    next: (createdReport) => {
                        this.isLoading = false;
                        this.notificationService.success('Reporte creado con éxito. Pendiente de verificación.');
                        this.router.navigate(['/map']); // O a donde quieras redirigir
                    },
                    error: (err) => {
                        this.isLoading = false;
                        this.notificationService.error(err.message || 'Error al crear el reporte.');
                    }
                });
            }
        }
    }

    getCategoryName(id: string): string {
        return this.categories.find(c => c.id === id)?.name || 'Desconocido';
    }

    toggleCategory(categoryId: string): void {
        const control = this.reportForm.get('categoryIds');
        const current = control?.value || [];

        const index = current.indexOf(categoryId);
        if (index > -1) {
            current.splice(index, 1); // quitar
        } else {
            current.push(categoryId); // agregar
        }

        control?.setValue([...current]); // importante: pasar nuevo array
    }

    isSelected(categoryId: string): boolean {
        return this.reportForm.get('categoryIds')?.value?.includes(categoryId);
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

    private loadImages(reportId: string | undefined): void {
        if (!reportId) return;
        this.reportService.getAllImagesReportById(reportId).subscribe({
            next: (report) => {
                this.imagePreview = report[0].imageUrl;
                console.log("Imagenes cargadas", this.imagePreview);
            },
            error: (err) => {
                this.snackBar.open('Error al cargar las imágenes del reporte.', 'Cerrar', { duration: 3000 });
            }
        }
        )
    }

    goBack(): void {
        history.back();
      }
}