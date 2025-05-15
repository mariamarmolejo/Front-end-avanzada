// src/app/core/services/report-status-history.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PaginatedHistoryResponse} from '../models/report-status-history/report-history.model' ;
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({ providedIn: 'root' })
export class ReportStatusHistoryService {


  private apiUrl =`${environment.urlBack}/report-status-histories`;

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

  getByPreviousStatus(status: string, page = 1, size = 20): Observable<PaginatedHistoryResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<PaginatedHistoryResponse>(`${this.apiUrl}/by-previous-status`, { 
      params: params
        .set('previousStatus', status),
      withCredentials: true 
    });
  }

  getByNewStatus(status: string, page = 1, size = 20): Observable<PaginatedHistoryResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<PaginatedHistoryResponse>(`${this.apiUrl}/by-new-satatus`, { 
      params: params
        .set('newStatus', status),
      withCredentials: true 
    });
}

// Método combinado para filtrar por estados
getByStatus(previousStatus: string | null, newStatus: string | null, page = 1, size = 20): Observable<PaginatedHistoryResponse> {
    
    // Caso 2: Solo previousStatus tiene valor
    if (previousStatus && !newStatus) {
        return this.getByPreviousStatus(previousStatus, page, size);
    }
    
    // Caso 3: Solo newStatus tiene valor
    if (!previousStatus && newStatus) {
        return this.getByNewStatus(newStatus, page, size);
    }
    
    return this.getAllHistories(page, size);
}
}
