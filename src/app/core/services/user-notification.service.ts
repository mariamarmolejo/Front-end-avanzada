import { Injectable, inject, NgZone } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

export interface NotificationDTO {
  title: string;
  message: string;
  reportId: string;
  type: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class UserNotificationService {
  private readonly storageKey = 'app_notifications';
  private readonly zone = inject(NgZone);
  private readonly isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

  private readonly notificationsSubject =
    new BehaviorSubject<NotificationDTO[]>(this.isBrowser ? this.loadFromStorage() : []);

  readonly notifications$ = this.notificationsSubject.asObservable();

  constructor() {
    if (this.isBrowser) {
      this.requestNotificationPermission();
      this.connectToSse();
    }
  }

  private connectToSse() {
    const eventSource = new EventSource('http://localhost:8080/api/v1/notifications/subscribe', {
      withCredentials: true
    });

    eventSource.addEventListener('new-notification', (event: MessageEvent) => {
      const parsed = this.parseNotification(event.data);
      if (parsed) {
        this.zone.run(() => this.pushNotification(parsed));
        this.showBrowserNotification(parsed);
      }
    });
    
    eventSource.onerror = () => eventSource.close();
  }

  private parseNotification(data: string): NotificationDTO | null {
    try {
      const obj = JSON.parse(data);
      if (
        typeof obj.title === 'string' &&
        typeof obj.message === 'string' &&
        typeof obj.reportId === 'string' &&
        typeof obj.type === 'string' &&
        typeof obj.createdAt === 'string'
      ) {
        return obj;
      }
    } catch {
      // no-op
    }
    return null;
  }

  private pushNotification(dto: NotificationDTO) {
    const current = [dto, ...this.notificationsSubject.value];
    this.notificationsSubject.next(current);
    if (this.isBrowser) {
      localStorage.setItem(this.storageKey, JSON.stringify(current));
    }
  }

  private loadFromStorage(): NotificationDTO[] {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) ?? '[]');
    } catch {
      return [];
    }
  }

  private requestNotificationPermission() {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }

  private showBrowserNotification(dto: NotificationDTO) {
    if (Notification.permission === 'granted') {
      new Notification(dto.title, {
        body: dto.message,
        data: dto.reportId
      });
    }
  }
}
