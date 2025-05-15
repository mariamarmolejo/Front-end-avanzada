import {
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    EventEmitter,
    Input,
    OnInit,
    Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Report } from '../../../../core/models/report.model';
import { ReportService } from '../../../../core/services/report.service';
import { CommentsService } from '../../../../core/services/comments.service';
import {
    CommentPaginatedResponse,
    CommentRequest
} from '../../../../core/models/comment.model';

@Component({
    selector: 'report-details-overlay',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule],
    templateUrl: './report-details-overlay.component.html',
    styleUrls: ['./report-details-overlay.component.css'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ReportDetailsOverlayComponent implements OnInit {
    @Input() report: Report | null = null;
    @Output() close = new EventEmitter<void>();
    newComment = '';
    public hasVoted = false;

    constructor(
        private reportService: ReportService,
        private commentService: CommentsService
    ) { }

    ngOnInit(): void {
        if (this.report?.id) {
            this.loadComments(this.report.id);
        }
    }

    loadComments(id: string): void {
        this.reportService.getAllCommentsReportById(id).subscribe({
            next: (resp: CommentPaginatedResponse) => {
                if (resp.size > 0 && this.report) {
                    this.report.comments = resp.content;
                }
            }
        });
    }

    addComment(): void {
        if (this.report?.id && this.newComment.trim()) {
            const req: CommentRequest = {
                reportId: this.report.id,
                comment: this.newComment.trim()
            };
            this.commentService.registerComments(req).subscribe({
                next: comment => {
                    this.report?.comments?.push(comment);
                    this.newComment = '';
                },
                error: err => console.error(err)
            });
        }
    }

    // report-details-overlay.component.ts
    toggleVote(report: Report): void {
        if (!report.id) {
          console.error('El reporte no tiene ID definido, no se puede alternar el voto.');
          return;
        }
      
        this.reportService.toggleVote(report.id).subscribe({
          next: (isNowVoted: boolean) => {
            // Ajuste optimista del contador
            const delta = isNowVoted ? +1 : -1;
            report.importantVotes = (report.importantVotes || 0) + delta;
            this.hasVoted = isNowVoted;
          },
          error: err => {
            console.error('Error al alternar voto:', err);
          }
        });
      }
      


    getCategoryNames(): string {
        return this.report?.categoryList?.map(c => c.name).join(', ') || 'Sin categoría';
    }
}
