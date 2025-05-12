import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { UserNotificationService } from '../../core/services/user-notification.service';
import { NotificationListComponent } from './notification-list.component';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-notification-toggle',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatBadgeModule,
    MatButtonModule,
    NotificationListComponent
  ],
  template: `
    <div class="notification-container">
      <button
        mat-icon-button
        (click)="togglePanel()"
        [matBadge]="unreadCount$ | async"
        matBadgeColor="warn"
        matBadgeSize="small"
        matBadgeHidden="(unreadCount$ | async) === 0">
        <mat-icon>notifications</mat-icon>
      </button>

      <div *ngIf="isPanelOpen" class="panel">
        <div class="panel-header">
          <h3>Notificaciones</h3>
        </div>
        <app-notification-list></app-notification-list>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: relative;
    }
    .panel {
      position: absolute;
      top: 48px;
      right: 0;
      width: 350px;
      background: white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      border-radius: 8px;
      z-index: 1000;
      overflow: hidden;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
    }
    .panel-header h3 {
      margin: 0;
      font-size: 1em;
    }
    .panel-header button {
      font-size: 0.8em;
    }
  `]
})
export class NotificationToggleComponent {
  private notificationService = inject(UserNotificationService);
  isPanelOpen = false;
  
  // Asegura que siempre sea un número (0 si es null/undefined)
  unreadCount$ = this.notificationService.notifications$.pipe(
    map(notifications => {
      const unread = notifications.filter(n => !n.read).length;
      return unread > 0 ? unread : null; // Retorna null si es 0 para ocultar el badge
    })
  );

  togglePanel(): void {
    this.isPanelOpen = !this.isPanelOpen;
  }

}