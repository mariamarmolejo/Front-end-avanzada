import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from "@angular/common/http";
import { Category, CategoryRequest } from "../models/category.model";
import { tap } from "rxjs/operators";
import { environment } from '../../../environments/environment.prod';


@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    private readonly apiUrl = `${environment.urlBack}/categories`; // Base URL for the categories API

    private cetegorySubject = new BehaviorSubject<Category[]>([]);
    categories$: Observable<Category[]> = this.cetegorySubject.asObservable();

    constructor(private http: HttpClient) {

    }

    getAllActiveCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(this.apiUrl,
            { withCredentials: true }
        ).pipe(
            tap((categories: Category[]) => {
                this.cetegorySubject.next(categories);
            })
        );
    }

    getAllCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(`${this.apiUrl}/all`,
            { withCredentials: true }
        ).pipe(
            tap((categories: Category[]) => {
                this.cetegorySubject.next(categories);
            })
        );
    }

    addCategory(category: CategoryRequest): Observable<Category> {
        return this.http.post<Category>(this.apiUrl, category,
            { withCredentials: true }
        );
    }

    /**
* Alterna el estado de activación de una categoría (baja lógica/reactivación)
* @param categoryId ID de la categoría a alternar
* @returns Observable con el nuevo estado de activación
*/
    toggleCategoryActivation(categoryId: string): Observable<{ activated: boolean }> {
        const url = `${this.apiUrl}/${categoryId}/toggle-activated`;
        return this.http.patch<{ activated: boolean }>(
            url,
            {}, // Body vacío ya que la lógica está en el servidor
            { withCredentials: true }
        );
    }

    getCategoryById(id: string): Observable<Category> {
        return this.http.get<Category>(`${this.apiUrl}/${id}`, { withCredentials: true });
    }

    updateCategory(id: string, request: CategoryRequest): Observable<Category> {
        return this.http.put<Category>(`${this.apiUrl}/${id}`, request, { withCredentials: true });
    }

}