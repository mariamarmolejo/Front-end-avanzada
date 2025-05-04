import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from "../../../core/services/auth.service";
import {Router} from "@angular/router";
import {NgIf} from "@angular/common";
import {Subscription} from "rxjs";

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

  constructor(private authService: AuthService, private router: Router) {
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
  logout() {
    this.authService.logout().subscribe({
        next: () => {
            this.router.navigate(['/login']);
            this.isOpen = false;
        },
        error: (error) => {
            console.error('Error during logout:', error);
        }
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
