// src/app/features/report-status-history/history-list.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { NotificationService } from '../../core/services/Notification.service';
import { ReportStatusHistoryService } from '../../core/services/report-history.service';
import { PaginatedHistoryResponse } from '../../core/models/report-status-history/report-history.model';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-history-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './report-history.component.html',
  styleUrls: ['./report-history.component.css']
})
export class HistoryListComponent implements OnInit {
  private historyService = inject(ReportStatusHistoryService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private router = inject(Router)

  readonly loading = signal(false);
  readonly paginatedData = signal<PaginatedHistoryResponse>({
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0
  });

  filterForm = this.fb.group({
    filterType: ['all'], // 'all', 'by-report', 'by-user', 'by-status'
    reportId: [''],
    userId: [''],
    previousStatus: [''],
    newStatus: [''],
    startDate: [''],
    endDate: ['']
  });

  readonly displayedColumns = [
    'id', 'reportId', 'userId',
    'previousStatus', 'newStatus', 'changedAt'
  ];

  ngOnInit(): void {
    this.loadAllHistories(1, 20);
  }

  loadAllHistories(page: number, size: number): void {
    this.loading.set(true);
    this.historyService.getAllHistories(page, size).subscribe({
      next: resp => this.handleSuccessResponse(resp),
      error: err => this.handleError(err)
    });
  }

  loadByReportId(reportId: string, page: number, size: number): void {
    this.loading.set(true);
    this.historyService.getByReportId(reportId, page, size).subscribe({
      next: resp => this.handleSuccessResponse(resp),
      error: err => this.handleError(err)
    });
  }

  loadByUserId(userId: string, page: number, size: number): void {
    this.loading.set(true);
    this.historyService.getByUserId(userId, page, size).subscribe({
      next: resp => this.handleSuccessResponse(resp),
      error: err => this.handleError(err)
    });
  }

  loadByStatus(reportId: string, previousStatus: string, newStatus: string, page: number, size: number): void {
    this.loading.set(true);
    // Asumiendo que tenemos un método en el servicio para esto
    // Si no, necesitaríamos implementar la lógica adecuada según los endpoints disponibles
    this.historyService.getByStatus(reportId, previousStatus, newStatus, page, size).subscribe({
      next: resp => this.handleSuccessResponse(resp),
      error: err => this.handleError(err)
    });
  }

  private handleSuccessResponse(resp: PaginatedHistoryResponse): void {
    this.paginatedData.set({
      ...resp,
      content: resp.content.map(h => ({
        ...h,
        changedAt: new Date(h.changedAt)
      }))
    });
    this.loading.set(false);
  }

  private handleError(err: any): void {
    console.error('Error cargando historiales', err);
    this.notificationService.error('No se pudo cargar el historial.');
    this.loading.set(false);
  }

  onPageChange(event: PageEvent) {
    const { filterType, ...filters } = this.filterForm.value;
    const page = event.pageIndex + 1;
    const size = event.pageSize;

    switch(filterType) {
      case 'by-report':
        this.loadByReportId(filters.reportId!, page, size);
        break;
      case 'by-user':
        this.loadByUserId(filters.userId!, page, size);
        break;
      case 'by-status':
        this.loadByStatus(
          filters.reportId!,
          filters.previousStatus!,
          filters.newStatus!,
          page,
          size
        );
        break;
      default:
        this.loadAllHistories(page, size);
    }
  }

  // En el método applyFilters() del componente
applyFilters(): void {
  const formValue = this.filterForm.value;
  const page = 1;
  const size = this.paginatedData().size;

  switch(formValue.filterType) {
    case 'by-report':
      if (!formValue.reportId) {
        this.notificationService.error('Debe ingresar un ID de reporte');
        return;
      }
      this.loadByReportId(formValue.reportId, page, size);
      break;
      
    case 'by-user':
      if (!formValue.userId) {
        this.notificationService.error('Debe ingresar un ID de usuario');
        return;
      }
      this.loadByUserId(formValue.userId, page, size);
      break;
      
    case 'by-status':
      if (!formValue.reportId) {
        this.notificationService.error('Debe ingresar un ID de reporte');
        return;
      }
      // Proporcionar valores por defecto para los estados
      const previousStatus = formValue.previousStatus || '';
      const newStatus = formValue.newStatus || '';
      this.loadByStatus(
        formValue.reportId,
        previousStatus,
        newStatus,
        page,
        size
      );
      break;
      
    default:
      this.loadAllHistories(page, size);
  }
}

  clearFilters(): void {
    this.filterForm.reset({ filterType: 'all' });
    this.loadAllHistories(1, this.paginatedData().size);
  }

  goBack(): void {
    this.router.navigate(['/map']);
  }
}