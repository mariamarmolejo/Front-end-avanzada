import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AuthService } from "../../../core/services/auth.service";
import { Router } from "@angular/router";
import { NgIf, NgFor, AsyncPipe } from "@angular/common";
import { Subscription } from "rxjs";
import { NotificationService } from '../../../core/services/Notification.service';
import { RouterModule } from '@angular/router';
import { NotificationListComponent } from '../../../features/notification/notification-list.component'; // Asegúrate de que esté en la ruta correcta
import { UserNotificationService } from '../../../core/services/user-notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  imports: [NgIf, RouterModule, AsyncPipe, NotificationListComponent]
})
export class HeaderComponent implements OnInit, OnDestroy {

  isOpen = false;
  isLoggedIn = false;
  notificationsOpen = false;
  isAdmin = false; 

  private authSubscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    public notificationService: NotificationService, // público para usarlo en el HTML
    public userNotificationService: UserNotificationService
  ) {}

  ngOnInit() {
    this.authSubscription.add(
      this.authService.getAuthStatus().subscribe(status => {
        this.isLoggedIn = status;
      })
    );

    this.authSubscription.add(
      this.authService.getAdminStatus().subscribe(status => {
        this.isAdmin = status;
      })
    );
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
  }

  logout(): void {
    this.notificationService
      .confirm('¿Estás seguro de que quieres cerrar sesión?', {
        title: 'Cerrar sesión',
        confirmText: 'Sí, salir',
        cancelText: 'No'
      })
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
    this.router.navigate(['/report/new']);
  }

  navigate(path: string) {
    this.router.navigate([path]);
    this.isOpen = false;
  }
}
