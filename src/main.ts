import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/core/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';


console.log('TOKEN:', environment.mapboxToken);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
