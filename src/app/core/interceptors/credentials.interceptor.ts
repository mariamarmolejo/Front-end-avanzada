import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError} from "rxjs/operators";
import {Router} from "@angular/router";
import {AuthService} from "../services/auth.service";

@Injectable()
export class CredentialsInterceptor implements HttpInterceptor {
    constructor(private router: Router, private authService: AuthService) {
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Clone the request to add the withCredentials option


        let modifiedRequest = request;

        if(!request.url.startsWith("https://api.cloudinary")){
            modifiedRequest =  request.clone({
                withCredentials: true
            });
        }

        // Pass the modified request to the next handler

        return next.handle(modifiedRequest).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    console.error('401 Unauthorized error intercepted');
                    this.authService.logout().subscribe(next => {
                        this.router.navigate(['/login']);
                    });
                    // Redirect to login or handle unauthorized access
                }
                return throwError(() => error);
            })
        );
    }
}