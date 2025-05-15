import {Injectable} from "@angular/core";
import { environment } from "../../../environments/environment.prod";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class CloudinaryService {
    private uploadPreset = 'default';

    constructor(private http: HttpClient) {
    }

    uploadImage(file: File): Observable<any> {
        const url = `https://api.cloudinary.com/v1_1/${environment.cloud_name}/image/upload`;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.uploadPreset);
        formData.append('api_key', environment.api_key)

        return this.http.post(url, formData);
    }

}