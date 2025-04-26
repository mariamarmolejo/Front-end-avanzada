import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError  } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';



@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/v1/auth';
  private authStatus = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  /**
   * Observable con el estado de autenticación (true si autenticado).
   */
  getAuthStatus(): Observable<boolean> {
    return this.authStatus.asObservable();
  }

  /**
   * Envía las credenciales al backend y actualiza el estado de autenticación.
   * Devuelve un Observable<boolean> que emite true en caso de éxito, false en caso de error.
   */
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
        return throwError(() => err); // Reemite el error completo para manejarlo en el componente
      })
    );
  }
  

  /**
   * Cierra sesión en frontend y backend, limpia el estado.
   */
  logout(): void {
    // Opcional: llamar a un endpoint de logout en backend
    // this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe();
    this.authStatus.next(false);
  }

}
