import { Routes } from '@angular/router';
import { RegisterComponent } from '../features/register/register.component';
import { LoginComponent } from '../features/auth/login/login.component';
import { MapViewComponent } from '../shared/components/map-view/map-view.component';
import { AuthGuard } from './guards/auth.guard';
import { VerificationComponent } from '../features/register/verification_code/verification.component';
import { ReportComponent } from "../features/report/report.component";
import { ResetPassword } from '../features/auth/reset_password/reset-password.component';
import { NotFoundComponent } from '../shared/components/page-not-found/not-found.component';
import { ReportListComponent } from '../features/report/report_list_admin/report-list.component';
import { HistoryListComponent } from '../features/report-status-histories/report-history.component';
import { ReportPdfGeneratorComponent } from '../features/report-summary/report-summary.component';
import { CategoryCreateComponent } from '../features/category/category.component';
import { CategoryListComponent } from '../features/category/category_list/category-list.component';

export const routes: Routes = [
  // Ruta raíz: redirige a login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Autenticación y registro
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Verificación de cuenta tras registro
  { path: 'validate-account', component: VerificationComponent },

  // Rutas protegidas
  { path: 'map', component: MapViewComponent, canActivate: [AuthGuard] },

  { path: 'report/new', component: ReportComponent, canActivate: [AuthGuard] },
  { path: 'report/edit/:id', component: ReportComponent, canActivate: [AuthGuard] }, // Ruta para editar

  // Verificación de cuenta tras registro
  { path: 'validate-account', component: VerificationComponent },

  //Validar resetear contraseña
  { path: 'reset-password', component: ResetPassword },

  //Pantallas de ADMIN
  { path: 'report-list-admin', component: ReportListComponent},
  { path: 'report-histories', component: HistoryListComponent},
  { path: 'report-summary', component: ReportPdfGeneratorComponent},
  { path: 'category/new', component: CategoryCreateComponent},
  { path: 'category-list', component: CategoryListComponent},

  // Comodín (cualquier otra ruta va a login, o a dónde prefieras)
  { path: '**', component: NotFoundComponent },
];

