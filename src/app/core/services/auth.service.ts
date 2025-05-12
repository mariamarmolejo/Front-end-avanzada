// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of} from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { UserRegistration } from '../models/users/user-registration.model';
import { UserResponse }     from '../models/users/user-response.model';
import { JwtResponse } from '../models/Auth/jwt-response.model';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:8080/api/v1';
  private apiUrlHealth = 'http://localhost:8080/api/v1/health';

  // estado de login
  private authStatus = new BehaviorSubject<boolean>(false);

    // estado de admin
    private adminStatus = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  getAuthStatus(): Observable<boolean> {
    return this.authStatus.asObservable();
  }

  getAdminStatus(): Observable<boolean> {
    return this.adminStatus.asObservable();
  }

  login(credentials: { email: string; password: string }): Observable<boolean> {
    return this.http.post<JwtResponse>(
      `${this.apiUrl}/auth/sessions`,
      { userName: credentials.email, password: credentials.password },
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this.authStatus.next(true);
        this.checkIsAdmin().subscribe(); // ✅ ejecuta la verificación
      }),
      map(() => true),
      catchError((err: HttpErrorResponse) => {
        this.authStatus.next(false);
        this.adminStatus.next(false); // ❌ login fallido → no es admin
        return throwError(() => err);
      })
    );
  }
  

  /**
   * Llama a /me, almacena latitud/longitud en sessionStorage
   * y actualiza el estado de authStatus.
   */
  getCurrentUser(): Observable<UserResponse> {
    return this.http.get<UserResponse>(
      `${this.apiUrl}/users/me`,
      { withCredentials: true }
    ).pipe(
      tap(user => {
        this.authStatus.next(true);
      }),
      catchError((err: HttpErrorResponse) => {
        this.authStatus.next(false);
        return throwError(() => err);
      })
    );
  }

  /**
   * Verifica autenticación realizando la petición a /me.
   * Devuelve true si 200 OK, false si error.
   */
  isLoggedIn(): Observable<boolean> {
    return this.getCurrentUser().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  logout(): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.apiUrl}/auth/logout`,
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this.authStatus.next(false);
        sessionStorage.removeItem('lat');
        sessionStorage.removeItem('lng');
        sessionStorage.removeItem('radiusKm');
      }),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * Registra un nuevo usuario.
   * POST /api/v1/auth
   */
  register(user: UserRegistration): Observable<any> {
    return this.http.post<UserResponse>(
      `${this.apiUrl}/users`,
      user
    ).pipe(
      tap(() => console.log('Registro exitoso')),
      catchError(err => {
        return throwError(() => err); // reemitir error completo
      })
    );
  }

  validateAccount(code: string): Observable<string> {
    return this.http.patch(
      `${this.apiUrl}/auth/activations?code=${code}`,
      {},
      { responseType: 'text' } // 👈 importante
    ).pipe(
      tap(() => console.log('Validación de cuenta exitosa')),
      catchError(err => {
        console.error('Error al validar la cuenta', err);
        return throwError(() => err);
      })
    );
  }


  sendCodeAgain(email: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/auth/activations/${email}`,
      {}
    ).pipe(
      tap(() => console.log('Código reenviado exitosamente')),
      catchError(err => {
        console.error('Error al reenviar el código', err);
        return throwError(() => err);
      })
    );
  }

  resendResetPasswordCode(email: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/auth/users/password-codes/${email}`,
      {}
    ).pipe(
      tap(() => console.log('Código reenviado exitosamente')),
      catchError(err => {
        console.error('Error al reenviar el código', err);
        return throwError(() => err);
      })
    );
  }



requestPasswordResetCode(email: string): Observable<void> {
  return this.http.post<void>(
    `${this.apiUrl}/auth/passwordCodes?email=${encodeURIComponent(email)}`,
    {}
  ).pipe(
    tap(() => console.log(`🔁 Código de recuperación enviado a ${email}`)),
    catchError((err: HttpErrorResponse) => {
      console.error('❌ Error al solicitar código de recuperación', err);
      return throwError(() => err);
    })
  );
}

resetPasswordWithCode(request: { code: string; newPassword: string }): Observable<any> {
  return this.http.patch<any>(
    `${this.apiUrl}/auth/users/password`,
    request
  ).pipe(
    tap(() => console.log('🔄 Contraseña restablecida con código')),
    catchError((err: HttpErrorResponse) => {
      console.error('❌ Error en resetPasswordWithCode', err);
      return throwError(() => err);
    })
  );
}

checkHealth(): void {
  this.http.get<boolean>(
      this.apiUrlHealth,
      {withCredentials: true}).subscribe({
      next: (response: boolean) => {
          this.authStatus.next(response);
          console.log('Health check response:', response);
      },
      error: (error: any) => {
          this.logout();
          console.error('Error in health check:', error);
      }
  });
}

/* Comprueba si el usuario autenticado es admin
* Endpoint supuesto: GET /api/v1/admin/check
* Devuelve 204 → admin, 401/403 → no admin
*/
checkIsAdmin(): Observable<boolean> {
  return this.http.get(
    `${this.apiUrl}/users/admin`,
    { withCredentials: true, observe: 'response' }
  ).pipe(
    map(resp => resp.status === 204), // ✅ true si es admin
    tap(isAdmin => this.adminStatus.next(isAdmin)), // ✅ actualiza el estado
    catchError(() => {
      this.adminStatus.next(false); // ❌ si error, no es admin
      return of(false);
    })
  );
}

}
