import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaginatedReportResponse} from '../../../core/models/page.model';
import { Report } from '../../../core/models/report.model';
import { ReportService } from '../../../core/services/report.service';
import { NotificationService } from '../../../core/services/Notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/dialog/confirm-dialog.component';
import { ConfirmDialogData } from '../../../shared/components/dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.css']
})
export class ReportListComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly paginatedData = signal<PaginatedReportResponse>({
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  });

  private router = inject(Router);

  // 1) Lista de estados disponibles
  readonly statuses = ['PENDING', 'VERIFIED', 'REJECTED', 'RESOLVED'] as const;
  // 2) Estado seleccionado para filtrar
  readonly selectedStatus = signal<string>('');

  // 3) Computed: contenido filtrado por estado
  readonly filteredContent = computed<Report[]>(() => {
    const all = this.paginatedData().content;
    const status = this.selectedStatus();
    return status
      ? all.filter(r => r.reportStatus === status)
      : all;
  });

  // Columnas de la tabla
  readonly displayedColumns = [
    'title',
    'description',
    'categories',
    'location',
    'reportStatus',
    'dateCreation',
    'importantVotes',
    'actions'
  ];
  
  ngOnInit(): void {
    this.loadReports(1, 10);
  }

  // Carga los reportes desde el backend
  // sobrecarga tu método loadReports para pasar el filtro de estado:
loadReports(page: number, size: number, status: string = ''): void {
  this.loading.set(true);
  this.reportService
    .getAllReportsPaginated(page, size, status)    // <-- que incluya status como param
    .subscribe({
      next: data => this.paginatedData.set(data),
      error: err => { /* … */ },
      complete: () => this.loading.set(false)
    });
}

  verifyReport(reportId?: string): void {
    if (!reportId) return;
    const data: ConfirmDialogData = {
      title: 'Verificar reporte',
      message: '¿Seguro que deseas verificar este reporte?',
      confirmText: 'Verificar',
      cancelText: 'Cancelar'
    };
    this.dialog.open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe(result => {
        if (result === true) {
          this.reportService.updateReportStatus(reportId, 'VERIFIED').subscribe({
            next: () => {
              this.notificationService.success('✅ Reporte verificado correctamente.');
              this.loadReports(1, 10); // Refresca la tabla
            },
            error: err => {
              console.error('❌ Error al verificar reporte:', err);
              this.notificationService.error('Ocurrió un error al verificar el reporte.');
            }
          });
        }
      });
  }
  
  rejectReport(reportId?: string): void {
    if (!reportId) return;
    const data: ConfirmDialogData = {
      title: 'Rechazar reporte',
      message: 'Por favor, indica el motivo del rechazo:',
      confirmText: 'Rechazar',
      cancelText: 'Cancelar',
      input: true,
      inputPlaceholder: 'Motivo de rechazo…'
    };
    this.dialog.open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe(reason => {
        if (typeof reason === 'string') {
          this.reportService.updateReportStatus(reportId, 'REJECTED', reason).subscribe({
            next: () => {
              this.notificationService.success('✅ Reporte rechazado correctamente.');
              this.loadReports(1, 10);
            },
            error: err => {
              console.error('❌ Error al rechazar reporte:', err);
              this.notificationService.error('Ocurrió un error al rechazar el reporte.');
            }
          });
        }
      });
  }
  
  resolveReport(reportId?: string): void {
    if (!reportId) return;
    const data: ConfirmDialogData = {
      title: 'Resolver reporte',
      message: '¿Deseas marcar este reporte como resuelto?',
      confirmText: 'Resolver',
      cancelText: 'Cancelar'
    };
    this.dialog.open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe(yes => {
        if (yes === true) {
          this.reportService.updateReportStatus(reportId, 'RESOLVED').subscribe({
            next: () => {
              this.notificationService.success('✅ Reporte marcado como resuelto.');
              this.loadReports(1, 10);
            },
            error: err => {
              console.error('❌ Error al resolver reporte:', err);
              this.notificationService.error('Ocurrió un error al resolver el reporte.');
            }
          });
        }
      });
  }
  
  onPageChange(event: PageEvent): void {
    // event.pageIndex es 0-based, backend espera 1-based
    const page = event.pageIndex + 1;
    const size = event.pageSize;
    this.loadReports(page, size, this.selectedStatus());
  }

  onStatusChange(status: string): void {
    this.selectedStatus.set(status);
    // al cambiar estado, recargamos del servidor
    this.loadReports(1, this.paginatedData().size, status);
  }

  goBack(): void {
    this.router.navigate(['/map']);
  }

}
