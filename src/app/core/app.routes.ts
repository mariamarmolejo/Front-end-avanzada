import {Routes} from '@angular/router';
import {RegisterComponent} from '../features/register/register.component';
import {LoginComponent} from '../features/auth/login/login.component';
import {MapViewComponent} from '../shared/components/map-view/map-view.component';
import {AuthGuard} from './guards/auth.guard';
import {VerificationComponent} from '../features/register/verification_code/verification.component';
import {ReportComponent} from "../features/report/report.component";

export const routes: Routes = [
    // Ruta raíz: redirige a login
    {path: '', redirectTo: 'login', pathMatch: 'full'},

    // Autenticación y registro
    {path: 'login', component: LoginComponent},
    {path: 'register', component: RegisterComponent},

    // Verificación de cuenta tras registro
    {path: 'validate-account', component: VerificationComponent},

    // Rutas protegidas
    {path: 'map', component: MapViewComponent, canActivate: [AuthGuard]},

    {path: 'report/new', component: ReportComponent},
    {path: 'report/edit/:id', component: ReportComponent}, // Ruta para editar

    // Comodín (cualquier otra ruta va a login, o a dónde prefieras)
    {path: '**', redirectTo: 'login'},
];

