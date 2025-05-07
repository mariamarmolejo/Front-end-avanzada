import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import {provideHttpClient, HTTP_INTERCEPTORS, withInterceptorsFromDi} from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
//import { CredentialsInterceptor } from './interceptors/credentials.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptorsFromDi()),
     /* {
      provide: HTTP_INTERCEPTORS,
      useClass: CredentialsInterceptor,
      multi: true // Es 'multi: true' porque puede haber varios interceptors
    }, */
    provideClientHydration(withEventReplay()),
    importProvidersFrom(
      ReactiveFormsModule,
      BrowserAnimationsModule,
      MatSnackBarModule
    )
  ]
};

