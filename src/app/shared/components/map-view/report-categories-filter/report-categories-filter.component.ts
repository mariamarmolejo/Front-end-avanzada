import {ChangeDetectorRef, Component, EventEmitter, OnInit, Output} from '@angular/core';
import {CommonModule, NgFor, NgIf} from '@angular/common'; // Importa CommonModule para *ngFor y *ngIf
import {CategoryService} from "../../../../core/services/category.service";
import {Category} from "../../../../core/models/category.model";
import {ReportService} from "../../../../core/services/report.service";
import {Report} from "../../../../core/models/report.model";
import {MatIcon} from '@angular/material/icon';
import {Router} from "@angular/router";

@Component({
    selector: 'report-categories-filter',
    standalone: true,
    imports: [CommonModule, NgFor, NgIf, MatIcon], // Añade CommonModule aquí
    templateUrl: './report-categories-filter.component.html',
    styleUrls: ['./report-categories-filter.component.css']
})
export class ReportCategoriesFilterComponent implements OnInit {
    @Output() actionFilterReport = new EventEmitter<Report[]>();


    categories: Category[] = [];
    allReports: Report[] = [];
    filteredReports: Report[] = [];
    selectedCategory = '';

    constructor(
        private categoryService: CategoryService,
        private reportService: ReportService,
        private router: Router
    ) {
    }

    ngOnInit(): void {
        // 1. Suscripción a los reportes
        this.reportService.reports$.subscribe((reports) => {
          this.allReports = reports;
          // Ordenamos y asignamos
          this.filteredReports = this.sortByVotesDesc(this.allReports);
        });
    
        // 2. Cargar categorías
        this.loadCategories();
        this.categoryService.categories$.subscribe(categories => {
          this.categories = categories;
        });
      }


    private loadCategories(): void {
        this.categoryService.getAllActiveCategories().subscribe();
    }

    private sortByVotesDesc(list: Report[]): Report[] {
        return [...list].sort(
          (a, b) => (b.importantVotes || 0) - (a.importantVotes || 0)
        );
      }

    filterReports(category: string): void {
        this.selectedCategory = category;
    
        const filtered = category
          ? this.allReports.filter(r =>
              r.categoryList?.some(cat => cat.name === category)
            )
          : [...this.allReports];
    
        this.filteredReports = this.sortByVotesDesc(filtered);
        this.actionFilterReport.emit(this.filteredReports);
      }
    
    flyToReport(report: Report): void {
        this.reportService.selectReport(report);
    }

    editReport(reportId: string | undefined): void {
        if (reportId) {
            this.router.navigate(['/report/edit', reportId]);
        }
    }

    searchAddress(query: string): void {
        // Implementa tu lógica de geocoding si quieres
        console.log('Buscar dirección:', query);
    }

    // Dentro de ReportDatailsComponent
    getCategoryNames(report: Report): string {
        if (!report.categoryList || report.categoryList.length === 0) {
            return 'Sin categoría';
        }
        return report.categoryList.map(c => c.name).join(', ');
    }


}