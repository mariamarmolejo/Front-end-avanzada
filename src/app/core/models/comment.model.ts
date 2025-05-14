export interface CommentResponse {
    id: string;
    userName: string;
    userId: string;
    reportId: string;
    comment: string;
}

export  interface CommentRequest {
    reportId: string;
    comment: string;
}

export interface CommentPaginatedResponse {
    content: CommentResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}