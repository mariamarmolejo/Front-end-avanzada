import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {CommentRequest, CommentResponse} from "../models/comment.model";
import {tap} from "rxjs/operators";
import {Observable} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class CommentsService {
    private apiUrl = `http://localhost:8080/api/v1/comments`;


    constructor(private http: HttpClient) {
    }

    registerComments(comment: CommentRequest): Observable<CommentResponse> {
        return this.http.post<CommentResponse>(`${this.apiUrl}`, comment, {withCredentials: true})
    }
}