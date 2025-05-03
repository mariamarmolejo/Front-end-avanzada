import { Report } from './report.model';

export interface PaginatedReportResponse {
    content: Report[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}