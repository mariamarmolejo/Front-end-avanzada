import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CategoryService } from '../../../core/services/category.service';
import { NotificationService } from '../../../core/services/Notification.service';
import { Category } from '../../../core/models/category.model';
import { ConfirmDialogComponent } from '../../../shared/components/dialog/confirm-dialog.component';
import { ConfirmDialogData } from '../../../shared/components/dialog/confirm-dialog.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle'; // <-- Añade esta línea

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSlideToggleModule
  ],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css']
})
export class CategoryListComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private notification   = inject(NotificationService);
  private router         = inject(Router);
  private dialog         = inject(MatDialog);

  loading = false;
  categories: Category[] = [];
  displayedColumns = ['id', 'name', 'description', 'createdAt',  'activated' ,'actions'];

  ngOnInit(): void {
    this.fetchCategories();
  }

  private fetchCategories(): void {
    this.loading = true;
    this.categoryService.getAllCategories().subscribe({
      next: (cats) => this.categories = cats,
      error: (err) => {
        console.error('Error cargando categorías', err);
        this.notification.error('No fue posible cargar las categorías');
      },
      complete: () => this.loading = false
    });
  }

  onAdd(): void {
    this.router.navigate(['/categories/create']);
  }

  onEdit(cat: Category): void {
    if (cat.id) {
      this.router.navigate(['/categories/edit', cat.id]);
    }
  }

  onToggleActivation(cat: Category): void {
    if (!cat.id) {
      return;
    }

    const currentStatus = cat.activated ? 'Desactivar' : 'Activar';
    const newStatus = cat.activated ? 'desactivada' : 'activada';

    const data: ConfirmDialogData = {
      title: `${currentStatus} Categoría`,
      message: `¿Seguro que deseas ${currentStatus.toLowerCase()} la categoría “${cat.name}”?`,
      confirmText: currentStatus,
      cancelText: 'Cancelar'
    };

    this.dialog.open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe(result => {
        if (result === true) {
          this.categoryService.toggleCategoryActivation(cat.id!).subscribe({
            next: (response) => {
              this.notification.success(`Categoría “${cat.name}” ${newStatus}`);
              this.fetchCategories(); // Actualiza la lista de categorías
              
              // Opcional: Actualizar el estado local inmediatamente
              cat.activated = response.activated;
            },
            error: (err) => {
              console.error('Error cambiando estado de categoría', err);
              this.notification.error(`No se pudo ${currentStatus.toLowerCase()} la categoría`);
            }
          });
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/map']);
  }
  
}
