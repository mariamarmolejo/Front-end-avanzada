import {Injectable} from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private authStatus = new BehaviorSubject<boolean>(this.isAuthenticated());

    isAuthenticated(): boolean {
        return typeof localStorage !== 'undefined' && !!localStorage.getItem('token'); //  Verifica si hay un token almacenado
    }

    // cambiar por llamado API, se debe manejar el token de manera segura. Seguramente sea mejor utilizar promesas aqui
    login(credentials: { email: String, password: string }): boolean {
        if (credentials.email === 'admin@example.com' && credentials.password === '1') {
            localStorage.setItem('token', 'token');
            this.authStatus.next(true);
            return true;
        } else {
            localStorage.removeItem('token');
            this.authStatus.next(false);
            return false;

        }
    }

    logout(): void {
        localStorage.removeItem('token');
        this.authStatus.next(false);
    }

    getAuthStatus() {
        return this.authStatus.asObservable();
    }
}