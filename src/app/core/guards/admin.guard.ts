// src/app/core/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
        return this.authService.checkIsAdmin().pipe(
          map(isAdmin => {
            return isAdmin
              ? true
              : this.router.createUrlTree(['/map']);  // autenticado pero no admin
          }),
          catchError(() => of(this.router.createUrlTree(['/map'])))
        );
    }
}
