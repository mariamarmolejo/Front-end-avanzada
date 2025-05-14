import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatIcon} from '@angular/material/icon';
import {Report} from "../../../../core/models/report.model";
import {ReportService} from "../../../../core/services/report.service";
import {CommentsService} from "../../../../core/services/comments.service";
import {CommentPaginatedResponse, CommentRequest} from "../../../../core/models/comment.model";

@Component({
    selector: 'report-details-overlay',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIcon],
    templateUrl: './report-details-overlay.component.html', // Corrected templateUrl
    styleUrls: ['./report-details-overlay.component.css']
})
export class ReportDetailsOverlayComponent implements OnInit {

    @Input() report: Report | null = null;
    @Output() close = new EventEmitter<void>();
    newComment: string = '';


    constructor(private reportService: ReportService,
                private commentService: CommentsService) {
    }

    ngOnInit(): void {
        if (this.report && this.report.id) {
            this.loadComments(this.report.id);
        }

    }

    addComment(): void {
        console.log(this.newComment);
        if (this.report && this.report.id && this.newComment.trim()) {
            const commentRequest: CommentRequest = {
                reportId: this.report.id,
                comment: this.newComment.trim()
            }
            // Por ahora, usamos un nombre de usuario genérico
            this.commentService.registerComments(commentRequest).subscribe(
                {
                    next: (response) => {
                        console.log('Comentario agregado:', response);
                        this.report?.comments?.push(response);
                    },
                    error: (error) => {
                        console.error('Error al agregar comentario:', error);
                    }
                }
            );
            this.newComment = '';
        }
    }



    loadComments(id: string): void {
        this.reportService.getAllCommentsReportById(id).subscribe({
            next: (comments: CommentPaginatedResponse) => {
                if (comments.size > 0 && this.report) {
                    this.report.comments = comments.content;
                }
            }
        });

    }

    getCategoryNames(report: Report | null): string {
        if (!report || !report.categoryList || report.categoryList.length === 0) {
            return 'Sin categoría';
        }
        return report.categoryList.map(c => c.name).join(', ');
    }
}