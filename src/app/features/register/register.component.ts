import {Component} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgIf} from "@angular/common";

@Component({
    selector: 'app-register',
    standalone: true,
    templateUrl: './register.component.html',
    imports: [
        ReactiveFormsModule, NgIf
    ],
    styleUrls: ['./register.component.css']
})
export class RegisterComponent {
    registerForm: FormGroup;

    constructor(private fb: FormBuilder) {
        this.registerForm = this.fb.group({
            name: ['', Validators.required],
            city: ['', Validators.required],
            phone: ['', Validators.required],
            address: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });
    }

    onRegister() {
        if (this.registerForm.valid) {
            alert('Registro exitoso de: ' + this.registerForm.value.name);
            console.log(this.registerForm.value);
        } else {
            alert('Formulario inválido');
            console.log('Form is invalid');
        }

    }
}
