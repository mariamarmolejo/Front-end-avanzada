import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import {ReportRequest} from '../models/report-request.model';
import {Report} from '../models/report.model';
import {PaginatedReportResponse} from "../models/page.model";
import {tap} from "rxjs/operators";
import {ImageService} from "./image.service";
import {ImageUploadResponse} from "../models/Image.upload.request";

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    // Asegúrate que la URL base sea correcta para tu API de reportes
    private apiUrl = `http://localhost:8080/api/v1/reports`; // Cambia si es necesario

    constructor(private http: HttpClient, private imageService : ImageService) {
    }

    /**
     * Crea un nuevo reporte enviando datos y archivos.
     */
    createReport(reportData: ReportRequest, image: File): Observable<Report> {

        return this.http.post<Report>(this.apiUrl, reportData).pipe(
            tap((response: Report) => {
                console.log('Reporte creado:', response);
                this.imageService.registerImage(image, response);
            }));
    }

    /**
     * Obtiene los reportes cerca al usuario autenticado.
     * (El backend debe filtrar por usuario basado en la sesión/token).
     */
    getReports(): Observable<PaginatedReportResponse> {
        let params = new HttpParams();

        params = params.set('latitud', '-75');
        params = params.set('longitud', '4');
        params = params.set('radio', '99990');

        // Asume que el endpoint /my-reports filtra por el usuario autenticado
        return this.http.get<PaginatedReportResponse>(`${this.apiUrl}`, {params}).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * Obtiene un reporte específico por ID.
     */
    getReportById(id: string): Observable<Report> {
        return this.http.get<Report>(`${this.apiUrl}/${id}`).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * Obtiene un reporte específico por ID.
     */
    getAllImagesReportById(id: string): Observable<ImageUploadResponse[]> {
        return this.http.get<ImageUploadResponse[]>(`${this.apiUrl}/${id}/images`).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * Actualiza un reporte existente.
     * TODO: Implementar manejo de añadir/eliminar imágenes si es necesario.
     */
    updateReport(id: string, reportData: Partial<ReportRequest>, image: File | null): Observable<Report> {
        console.log(reportData)
        if (image) {
            this.getAllImagesReportById(id).subscribe((images) => {
                images.forEach((image) => {
                    this.imageService.deleteImage(image.id);
                });
                this.imageService.registerImage(image, {id} as Report);

            });
        }
        return this.http.put<Report>(`${this.apiUrl}/${id}`, reportData).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * Marca un reporte como inactivo (eliminación lógica).
     */
    deleteReport(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * Marca un reporte como resuelto.
     * Asume un endpoint específico o un PUT/PATCH que cambie el estado.
     */
    resolveReport(id: string): Observable<Report> {
        // Ajusta el endpoint y método (PATCH podría ser más apropiado) según tu API
        return this.http.patch<Report>(`${this.apiUrl}/${id}/resolve`, {}).pipe(
            catchError(this.handleError)
        );
    }


    // Helper para manejo básico de errores
    private handleError(error: any): Observable<never> {
        console.error('Ocurrió un error en ReportService:', error);
        // Puedes mejorar esto para mostrar mensajes más específicos al usuario
        return throwError(() => new Error('Error en la operación del reporte. Intenta de nuevo.'));
    }
}