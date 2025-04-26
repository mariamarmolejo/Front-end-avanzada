import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.getAuthStatus().pipe(
      take(1), // solo nos interesa el valor actual
      map(isAuth => {
        if (isAuth) {
          return true;           // usuario autenticado: permite
        } else {
          return this.router.createUrlTree(['/login']); // redirige a /login
        }
      })
    );
  }
}

