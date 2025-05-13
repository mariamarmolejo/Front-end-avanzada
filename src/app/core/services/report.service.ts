import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BehaviorSubject, catchError, Observable, throwError} from 'rxjs';
import {ReportRequest} from '../models/report-request.model';
import {Report} from '../models/report.model';
import {PaginatedReportResponse} from "../models/page.model";
import {tap, map} from "rxjs/operators";
import {ImageService} from "./image.service";
import {ImageUploadResponse} from "../models/Image.upload.request";
import { Session } from 'node:inspector';
import { ReportStatusUpdate } from '../models/report/report-status-update.model';

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    // Asegúrate que la URL base sea correcta para tu API de reportes
    private apiUrl = `http://localhost:8080/api/v1/reports`; // Cambia si es necesario
    private selectedReportSource = new BehaviorSubject<Report | null>(null);
    selectedReport$ = this.selectedReportSource.asObservable();

    private reportsSubject = new BehaviorSubject<Report[]>([]);
    reports$: Observable<Report[]> = this.reportsSubject.asObservable();

    constructor(private http: HttpClient, private imageService : ImageService) {
    }

    selectReport(report: Report) {
        this.selectedReportSource.next(report);
    }

    /**
     * Crea un nuevo reporte enviando datos y archivos.
     */
    createReport(reportData: ReportRequest, image: File): Observable<Report> {

        return this.http.post<Report>(this.apiUrl, 
            reportData,
            {withCredentials: true}
        ).pipe(
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

        params = params.set('latitud', sessionStorage.getItem('lat') || '');
        params = params.set('longitud', sessionStorage.getItem('lng') || '');
        params = params.set('radio', sessionStorage.getItem('radiusKm') || '');


        // Asume que el endpoint /my-reports filtra por el usuario autenticado
        return this.http.get<PaginatedReportResponse>(`${this.apiUrl}`, {params, withCredentials:true} ).pipe(
            tap((response: PaginatedReportResponse) => {
                this.reportsSubject.next(response.content);
            })
        );
    }

    refreshReports() {
        this.getReports().subscribe();
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

    updateReportStatus(
        reportId: string,
        status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'RESOLVED',
        rejectionMessage?: string
      ): Observable<void> {
        const dto: ReportStatusUpdate = { status, rejectionMessage: rejectionMessage ?? null };
        return this.http.patch<void>(
          `${this.apiUrl}/${reportId}/status`,
          dto,
          { withCredentials: true }
        );
      }

   /**
 * Obtiene todos los reportes activos (no eliminados) paginados. Solo para admins.
 */
   getAllReportsPaginated(
    page = 1,
    size = 10,
    status?: string
  ): Observable<PaginatedReportResponse> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);
  
    // Si vienen estados, los añadimos como query param
    if (status) {
      params = params.set('status', status);
    }
  
    return this.http
      .get<PaginatedReportResponse>(`${this.apiUrl}/admin`, {
        params,
        withCredentials: true
      })
      .pipe(
        map(response => {
          const content: Report[] = response.content.map(report => ({
            ...report,
            createdAt: new Date(report.createdAt),
            updatedAt: report.updatedAt ? new Date(report.updatedAt) : undefined,
            resolvedAt: report.resolvedAt ? new Date(report.resolvedAt) : undefined
          }));
  
          return {
            ...response,
            content
          };
        }),
        tap(response => {
          console.log(
            `Reportes cargados: página ${response.page} de ${response.totalPages}, ` +
            `elementos totales: ${response.totalElements}`
          );
        }),
        catchError(err => {
          console.error('Error al obtener reportes paginados', err);
          return throwError(() => err);
        })
      );
  }
  
  
  
    // Helper para manejo básico de errores
    private handleError(error: any): Observable<never> {
        console.error('Ocurrió un error en ReportService:', error);
        // Puedes mejorar esto para mostrar mensajes más específicos al usuario
        return throwError(() => new Error('Error en la operación del reporte. Intenta de nuevo.'));
    }
}