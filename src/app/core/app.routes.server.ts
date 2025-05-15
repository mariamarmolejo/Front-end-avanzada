import { RenderMode, ServerRoute } from '@angular/ssr';
import {ReportService} from "./services/report.service";
import {inject} from "@angular/core";
import {map} from "rxjs/operators";

export const serverRoutes: ServerRoute[] = [
  {
    path: 'report/edit/:id',
    renderMode: RenderMode.Server // or remove the renderMode property
  },
  {
    path: 'categories/edit/:id',
    renderMode: RenderMode.Server // or remove the renderMode property
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
