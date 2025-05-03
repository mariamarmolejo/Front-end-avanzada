import {HttpClient} from "@angular/common/http";
import {ImageUploadRequest} from "../models/Image.upload.request";
import {Injectable} from "@angular/core";
import {CloudinaryService} from "./cloudinary.service";
import {Report} from "../models/report.model";

@Injectable({
    providedIn: 'root'
})
export class ImageService {
    private apiUrl = `http://localhost:8080/api/v1/images`;


    constructor(private http: HttpClient, private cloudinaryService: CloudinaryService) {
    }

    registerImage(file: File, report: Report): void {
        this.cloudinaryService.uploadImage(file).subscribe({
                next: (response) => {
                    console.log('Imagen subida:', response);
                    if (report.id) {
                        const imageUploadRequest: ImageUploadRequest = {
                            imageUrl: response.url,
                            reportId: report.id
                        };
                        this.http.post(`${this.apiUrl}`, imageUploadRequest).subscribe({
                            next: (response) => {
                                console.log('Imagen registrada en el reporte:', response);
                            },
                            error: (error) => {
                                console.error('Error registrando la imagen en el reporte:', error);
                            }
                        });
                    }
                },
                error: (error) => {
                    console.error('Error subiendo la imagen  cloudinary:', error);
                }
            }
        );
    }
}