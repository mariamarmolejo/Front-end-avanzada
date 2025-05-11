import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CategoryService } from '../../core/services/category.service';
import { NotificationService } from '../../core/services/Notification.service';
import { CategoryRequest } from '../../core/models/category.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-category-create',
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
export class CategoryCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private notification = inject(NotificationService);

  loading = false;
  form = this.fb.group({
    name:        ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]]
  });

  ngOnInit(): void {
    // Nada por ahora
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    
    const formValue = this.form.value;

    const request: CategoryRequest = {
    name: formValue.name ?? '',
    description: formValue.description ?? ''
    };


    this.categoryService.addCategory(request).subscribe({
      next: (resp) => {
        this.notification.success('Categoría creada correctamente');
        this.form.reset();
      },
      error: (err) => {
        console.error('Error creando categoría', err);
        this.notification.error(
          err?.error?.message || 'Ocurrió un error al crear la categoría'
        );
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  get name() { return this.form.get('name'); }
  get description() { return this.form.get('description'); }

  
  goBack(): void {
    history.back();
  }
}
