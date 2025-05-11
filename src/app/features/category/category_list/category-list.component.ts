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
    MatDialogModule
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
  displayedColumns = ['id', 'name', 'description', 'createdAt', 'actions'];

  ngOnInit(): void {
    this.fetchCategories();
  }

  private fetchCategories(): void {
    this.loading = true;
    this.categoryService.getAllActiveCategories().subscribe({
      next: (cats) => this.categories = cats,
      error: (err) => {
        console.error('Error cargando categorías', err);
        this.notification.error('No fue posible cargar las categorías');
      },
      complete: () => this.loading = false
    });
  }

  onAdd(): void {
    this.router.navigate(['category/new']);
  }

  onEdit(cat: Category): void {
    if (cat.id) {
      this.router.navigate(['/categories/edit', cat.id]);
    }
  }

  onDeactivate(cat: Category): void {
    if (!cat.id) {
      return;
    }

    const data: ConfirmDialogData = {
      title: 'Desactivar Categoría',
      message: `¿Seguro que deseas desactivar la categoría “${cat.name}”?`,
      confirmText: 'Desactivar',
      cancelText: 'Cancelar'
    };

    this.dialog.open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe(result => {
        if (result === true) {
          this.categoryService.deactivateCategory(cat.id!).subscribe({
            next: () => {
              this.notification.success(`Categoría “${cat.name}” desactivada`);
              this.fetchCategories();
            },
            error: (err) => {
              console.error('Error desactivando categoría', err);
              this.notification.error('No se pudo desactivar la categoría');
            }
          });
        }
      });
  }

  goBack(): void {
    history.back();
  }
  
}
