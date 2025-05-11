// src/main.ts
import { bootstrapApplication }    from '@angular/platform-browser';
import { AppComponent }            from './app/app.component';
import { provideHttpClient }       from '@angular/common/http';
import { HTTP_INTERCEPTORS }       from '@angular/common/http';
import { provideRouter }           from '@angular/router';
import { routes }                  from './app/core/app.routes';
import { AuthInterceptor }         from './app/core/interceptors/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),  // HttpClient standalone

    // Interceptor para manejar 401 → refresh token
    /*{
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }, */

    provideRouter(routes),
  ]
}).catch(err => console.error(err));
