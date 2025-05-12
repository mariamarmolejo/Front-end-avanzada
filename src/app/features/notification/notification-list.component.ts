// src/app/components/notification-list.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserNotificationService } from '../../core/services/user-notification.service';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="list">
      <div *ngIf="(notifications$ | async)?.length === 0" class="empty">
        No tienes notificaciones
      </div>
      <div *ngFor="let notification of notifications$ | async" 
           class="item" 
           [class.unread]="!notification.read"
           (click)="markAsRead(notification.id)">
        <div class="icon-container">
          <img [src]="getIcon(notification.type)" class="icon">
        </div>
        <div class="content">
          <strong>{{ notification.title }}</strong>
          <small>{{ notification.createdAt | date:'medium' }}</small>
          <p>{{ notification.message }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .list { 
      max-height: 400px; 
      overflow-y: auto;
      padding: 8px;
    }
    .item {
      display: flex;
      padding: 12px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      gap: 12px;
    }
    .item:last-child { border: none; }
    .item.unread { background-color: #f8f9fe; }
    .empty { 
      padding: 16px; 
      color: #666;
      text-align: center;
    }
    .icon-container {
      width: 24px;
      height: 24px;
    }
    .icon {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .content {
      flex: 1;
    }
    small { 
      display: block; 
      color: #999; 
      margin: 4px 0; 
      font-size: 0.8em;
    }
    strong {
      font-size: 0.9em;
    }
    p {
      margin: 0;
      font-size: 0.85em;
      color: #555;
    }
  `]
})
export class NotificationListComponent {
  private notificationService = inject(UserNotificationService);
  notifications$ = this.notificationService.notifications$;

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id);
  }

  getIcon(type: string): string {
    return this.notificationService.getNotificationIcon(type as any);
  }
}