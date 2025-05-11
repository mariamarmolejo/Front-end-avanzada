// src/app/core/services/report-status-history.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PaginatedHistoryResponse} from '../models/report-status-history/report-history.model' ;
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportStatusHistoryService {
  private apiUrl = 'http://localhost:8080/api/v1/report-status-histories';

  constructor(private http: HttpClient) {}

  getAllHistories(page = 1, size = 20): Observable<PaginatedHistoryResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<PaginatedHistoryResponse>(this.apiUrl, { params, withCredentials: true });
  }

  getByReportId(reportId: string, page = 1, size = 20): Observable<PaginatedHistoryResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<PaginatedHistoryResponse>(`${this.apiUrl}/by-report`, { 
      params: params.set('reportId', reportId),
      withCredentials: true 
    });
  }

  getByUserId(userId: string, page = 1, size = 20): Observable<PaginatedHistoryResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<PaginatedHistoryResponse>(`${this.apiUrl}/by-user`, { 
      params: params.set('userId', userId),
      withCredentials: true 
    });
  }

  getByPreviousStatus(reportId: string, status: string, page = 1, size = 20): Observable<PaginatedHistoryResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<PaginatedHistoryResponse>(`${this.apiUrl}/by-report/previous-status`, { 
      params: params
        .set('reportId', reportId)
        .set('previousStatus', status),
      withCredentials: true 
    });
  }

  // Método combinado para filtrar por estados anterior y nuevo
  getByStatus(reportId: string, previousStatus: string, newStatus: string, page = 1, size = 20): Observable<PaginatedHistoryResponse> {
    // Implementación según los endpoints disponibles en tu backend
    // Esto es un ejemplo - ajusta según tus necesidades reales
    if (previousStatus && !newStatus) {
      return this.getByPreviousStatus(reportId, previousStatus, page, size);
    }
    // Aquí podrías añadir más lógica para otros casos
    // Por ahora devolvemos todos los historiales del reporte
    return this.getByReportId(reportId, page, size);
  }
}
