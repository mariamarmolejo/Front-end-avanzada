import {Routes} from '@angular/router';
import {RegisterComponent} from "../features/register/register.component";
import {LoginComponent} from "../features/auth/login/login.component";
import {MapViewComponent} from "../shared/components/map-view/map-view.component";
import {AuthGuard} from './guards/auth.guard';


export const routes: Routes = [
    {path: 'login', component: LoginComponent}, // Ruta raíz
    {path: 'register', component: RegisterComponent}, // Ruta de "Register"
    {path: 'map', component: MapViewComponent, canActivate: [AuthGuard]}, // Ruta de "Register"
    {path: '**', component: LoginComponent} // Ruta comodín


];
