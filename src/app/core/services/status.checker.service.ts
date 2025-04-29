import {Injectable, OnDestroy} from '@angular/core';
import { Observable, interval, Subscription } from 'rxjs';
import {AuthService} from './auth.service';
import { tap } from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class StatusCheckerService implements OnDestroy {
    private statusCheckSubscription: Subscription | null = null;

    constructor(private authService: AuthService) {

    }

    startStatusCheck(): Observable<number> {
        const statusCheck = interval(120000).pipe(
            tap(() => {
                console.log('Checking status...');
                if (this.authService.isLoggedIn()) {
                    this.authService.checkHealth();
                }
            })
        );

        // Subscribe internally if needed
        this.statusCheckSubscription = statusCheck.subscribe();

        return statusCheck;

    }

    stopStatusCheck(): void {
        if (this.statusCheckSubscription) {
            this.statusCheckSubscription.unsubscribe();
            this.statusCheckSubscription = null;
        }
    }

    ngOnDestroy(): void {
        // Ensure the interval is cleared when the service is destroyed
        this.stopStatusCheck();
    }
}