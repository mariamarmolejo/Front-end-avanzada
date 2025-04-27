// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { UserRegistration } from '../models/user-registration.model';
import { UserResponse }     from '../models/user-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/v1/auth';

  // estado de login
  private authStatus = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  getAuthStatus(): Observable<boolean> {
    return this.authStatus.asObservable();
  }

  login(credentials: { email: string; password: string }): Observable<boolean> {
    return this.http.post<any>(
      `${this.apiUrl}/sessions`,
      { userName: credentials.email, password: credentials.password },
      { withCredentials: true }
    ).pipe(
      tap(() => this.authStatus.next(true)),
      map(() => true),
      catchError(err => {
        this.authStatus.next(false);
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    this.authStatus.next(false);
  }

  /**
   * Registra un nuevo usuario.
   * POST /api/v1/auth
   */
  register(user: UserRegistration): Observable<any> {
    return this.http.post<any>(
      "http://localhost:8080/api/v1/users",
      user
    ).pipe(
      tap(() => console.log('Registro exitoso')),
      catchError(err => {
        return throwError(() => err); // reemitir error completo
      })
    );
  }
  
}
