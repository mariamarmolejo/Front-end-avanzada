// src/main.ts
import { bootstrapApplication }         from '@angular/platform-browser';
import { AppComponent }                 from './app/app.component';
import {
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';
import { provideRouter }                from '@angular/router';
import { routes }                       from './app/core/app.routes';
import { AuthInterceptor }              from './app/core/interceptors/auth.interceptor';
import { HTTP_INTERCEPTORS }            from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [
    // 1) HttpClient + lectura de HTTP_INTERCEPTORS
    provideHttpClient(
      withInterceptorsFromDi()
    ),

    // 2) Registramos nuestra clase AuthInterceptor
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },

    // 3) Router
    provideRouter(routes),
  ]
}).catch(err => console.error(err));
