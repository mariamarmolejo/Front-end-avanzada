import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../../core/services/category.service';
import { NotificationService } from '../../core/services/Notification.service';
import { CategoryRequest, Category } from '../../core/models/category.model';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css']
})
export class CategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private notification = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  form = this.fb.group({
    name:        ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]]
  });

  loading = false;
  isEditMode = false;
  categoryId: string | null = null;

  ngOnInit(): void {
    // ¿Viene un id en la ruta?
    this.categoryId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.categoryId;

    if (this.isEditMode && this.categoryId) {
      // Cargar datos existentes
      this.loading = true;
      this.categoryService.getCategoryById(this.categoryId).subscribe({
        next: (cat: Category) => {
          this.form.patchValue({
            name: cat.name,
            description: cat.description
          });
        },
        error: (err) => {
          this.notification.error('No se pudo cargar la categoría');
        },
        complete: () => this.loading = false
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const req: CategoryRequest = {
      name:        this.form.value.name!,
      description: this.form.value.description || ''
    };

    this.loading = true;
    const action$ = this.isEditMode
      ? this.categoryService.updateCategory(this.categoryId!, req)
      : this.categoryService.addCategory(req);

    action$.subscribe({
      next: () => {
        const msg = this.isEditMode
          ? 'Categoría actualizada correctamente'
          : 'Categoría creada correctamente';
        this.notification.success(msg);
        this.router.navigate(['/category-list']);
      },
      error: (err) => {
        const msg = this.isEditMode
          ? 'Error al actualizar categoría'
          : 'Error al crear categoría';
        this.notification.error(msg);
      },
      complete: () => this.loading = false
    });
  }

  goBack(): void {
    this.router.navigate(['/category-list']);
  }

  get name()        { return this.form.get('name'); }
  get description() { return this.form.get('description'); }
}
