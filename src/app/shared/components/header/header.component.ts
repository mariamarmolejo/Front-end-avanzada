import { Component } from '@angular/core';
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
export class HeaderComponent {
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
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
