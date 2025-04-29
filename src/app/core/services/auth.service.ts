// src/app/services/auth.service.ts
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';
import {UserRegistration} from '../models/user-registration.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:8080/api/v1/auth';
    private apiUrlHealth = 'http://localhost:8080/api/v1/health';


    // estado de login
    private authStatus = new BehaviorSubject<boolean>(this.isLoggedIn());

    constructor(private http: HttpClient) {
    }

    getAuthStatus(): Observable<boolean> {
        return this.authStatus.asObservable();
    }

    login(credentials: { email: string; password: string }): Observable<boolean> {
        return this.http.post<any>(
            `${this.apiUrl}/sessions`,
            {userName: credentials.email, password: credentials.password}
        ).pipe(
            tap(() => {
                this.authStatus.next(true);
                localStorage.setItem('usuario', credentials.email);
            }),
            map(() => true),
            catchError(err => {
                this.logout();
                return throwError(() => err);
            })
        );
    }

    logout(): Observable<boolean> {
        return this.http.get<boolean>(
            `${this.apiUrl}/logout`
        ).pipe(
            tap(() => {
                    this.deleteSession();
                    console.log('Logout exitoso');
                }
            ),
            catchError(err => {
                this.deleteSession();
                return throwError(() => err);
            })
        );

    }

    private deleteSession = () => {
        this.authStatus.next(false);
        localStorage.removeItem('usuario');
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

    /**
     * Verifica si la cookie JSESSIONID existe.
     */
    isLoggedIn(): boolean {
        return typeof localStorage !== 'undefined' && !!localStorage.getItem('usuario'); //  Verifica si hay un token almacenado

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

}
