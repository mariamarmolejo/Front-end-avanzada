import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from "../../../core/services/auth.service";
import {Router} from "@angular/router";
import {NgIf} from "@angular/common";
import {Subscription} from "rxjs";
import { NotificationService } from '../../../core/services/Notification.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  imports: [NgIf]
})
export class HeaderComponent implements OnInit, OnDestroy {
  isOpen = false;
  isLoggedIn = false;
  private authSubscription!: Subscription;

  constructor(private authService: AuthService, private router: Router, 
    private notificationService: NotificationService) {
  }

  ngOnInit() {
    this.authSubscription = this.authService.getAuthStatus().subscribe(status => {
      this.isLoggedIn = status;
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  logout(): void {
    this.notificationService
      .confirm(
        '¿Estás seguro de que quieres cerrar sesión?',
        {
          title: 'Cerrar sesión',
          confirmText: 'Sí, salir',
          cancelText: 'No'
        }
      )
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.notificationService.success('Cerrando sesión...');
        this.authService.logout().subscribe({
          next: () => this.router.navigate(['/login']),
          error: err => {
            console.error(err);
            this.notificationService.error('No se pudo cerrar sesión');
          }
        });
      });
  }

    register() {
        console.log("call register");
        this.router.navigate(['/report/new']);

    }

    navigate(path: string) {
        this.router.navigate([path]);
        this.isOpen = false;
    }
}
