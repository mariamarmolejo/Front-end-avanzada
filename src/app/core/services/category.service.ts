import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from "@angular/common/http";
import {Category} from "../models/category.model";


@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    private readonly apiUrl = 'http://localhost:8080/api/v1/categories'; // Base URL for the categories API

    constructor(private http: HttpClient) {

    }

    getAllActiveCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(this.apiUrl,
            { withCredentials: true }
        );
    }
    addCategory(category: Category): Observable<Category> {
        return this.http.post<Category>(this.apiUrl, category);
    }
}