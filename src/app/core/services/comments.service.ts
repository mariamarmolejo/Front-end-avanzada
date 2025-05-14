import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {CommentRequest, CommentResponse} from "../models/comment.model";

@Injectable({
    providedIn: 'root'
})
export class CommentsService {
    private apiUrl = `http://localhost:8080/api/v1/comments`;


    constructor(private http: HttpClient) {
    }

    registerComments(comment: CommentRequest): void {
        this.http.post<CommentResponse>(`${this.apiUrl}`, comment, {withCredentials: true}).subscribe({
                next: (response) => {
                    console.log('Comentario registrado:', response);
                },
                error: (error) => {
                    console.error('Error subiendo el commentario:', error);
                }
            }
        );
    }
}