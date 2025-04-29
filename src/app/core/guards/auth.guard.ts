import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      return true; //  Usuario autenticado, permite acceso.
    } else {
      this.router.navigate(['/login']); //  Usuario no autenticado, redirigir a login.
      return false;
    }
  }
}

