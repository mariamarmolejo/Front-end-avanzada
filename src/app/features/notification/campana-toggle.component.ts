// src/app/components/notification-toggle.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { UserNotificationService } from '../../core/services/user-notification.service';
import { NotificationListComponent } from './notification-list.component';

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
    <button
      mat-icon-button
      (click)="open = !open"
      [matBadge]="(svc.notifications$ | async)?.length"
      matBadgeColor="warn">
      <mat-icon>notifications</mat-icon>
    </button>

    <div *ngIf="open" class="panel">
      <app-notification-list></app-notification-list>
    </div>
  `,
  styles: [`
    .panel {
      position: absolute;
      top: 48px; right: 0;
      width: 320px;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      border-radius: 6px;
      z-index: 1000;
    }
  `]
})
export class NotificationToggleComponent {
  svc = inject(UserNotificationService);
  open = false;
}
