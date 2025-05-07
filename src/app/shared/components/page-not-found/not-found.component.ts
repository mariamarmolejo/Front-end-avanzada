import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { RouterModule } from '@angular/router'; // <-- IMPORTA ESTO

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.css'],
  standalone: true,
  imports: [
      RouterModule // <-- AGREGA ESTO
    ]
})
export class NotFoundComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/map']);
  }
}
