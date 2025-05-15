import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {CommentRequest, CommentResponse} from "../models/comment.model";
import {tap} from "rxjs/operators";
import {Observable} from "rxjs";
import { environment } from "../../../environments/environment.prod";

@Injectable({
    providedIn: 'root'
})
export class CommentsService {
    private apiUrl = `${environment.urlBack}/comments`;


    constructor(private http: HttpClient) {
    }

    registerComments(comment: CommentRequest): Observable<CommentResponse> {
        return this.http.post<CommentResponse>(`${this.apiUrl}`, comment, {withCredentials: true})
    }
}