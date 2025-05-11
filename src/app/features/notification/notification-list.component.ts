// src/app/components/notification-list.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserNotificationService, NotificationDTO } from '../../core/services/user-notification.service';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="list">
      <div *ngIf="(svc.notifications$ | async)?.length === 0" class="empty">
        Sin notificaciones
      </div>
      <div *ngFor="let n of svc.notifications$ | async" class="item">
        <strong>{{ n.title }}</strong>
        <small>{{ formatDate(n.createdAt) }}</small>
        <p>{{ n.message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .list { max-height: 300px; overflow-y: auto; }
    .item { padding: .5rem; border-bottom: 1px solid #eee; }
    .item:last-child { border: none; }
    .empty { padding: 1rem; color: #666; }
    small { display: block; color: #999; margin-bottom: .25rem; }
  `]
})
export class NotificationListComponent {
  svc = inject(UserNotificationService);
  formatDate(s: string) {
    return new Date(s).toLocaleString();
  }
}
