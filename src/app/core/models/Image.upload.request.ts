export interface ImageUploadRequest {
    imageUrl: string;
    reportId: string
}

export interface ImageUploadResponse {
    imageUrl: string;
    reportId: string;
    id: string
}