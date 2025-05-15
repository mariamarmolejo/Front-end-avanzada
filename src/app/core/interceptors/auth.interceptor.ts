// src/app/core/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {environment} from "../../../environments/environment";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private refreshing = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        // 1) Si no es 401, o ya estamos refrescando, o es petición de refresh → propaga
        if (
          err.status !== 401 ||
          this.refreshing ||
          req.url.endsWith('/accessTokens')
        ) {
          return throwError(() => err);
        }

        // 2) Es 401 y podemos intentar refresh
        this.refreshing = true;
        return this.http
          .post<void>(
            `${environment.urlBack}/api/v1/auth/accessTokens`,
            {},                  // body vacío; cookie refresh_token enviada por navegador
            { withCredentials: true }
          )
          .pipe(
            switchMap(() => {
              // 3) Refresh ok → reintenta la petición original
              return next.handle(req);
            }),
            catchError(refreshErr => {
              // 4) Si falla el refresh, redirige al login
              this.router.navigate(['/login']);
              return throwError(() => refreshErr);
            }),
            finalize(() => {
              this.refreshing = false;
            })
          );
      })
    );
  }
}
