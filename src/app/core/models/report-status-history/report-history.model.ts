export enum ReportStatus {
    PENDING = 'PENDING',
    DELETED = 'DELETED',
    RESOLVED = 'RESOLVED',
    VERIFIED = 'VERIFIED',
    REJECTED = 'REJECTED',
  }

  export interface ReportStatusHistory {
    id: string;
    reportId: string;
    userId: string;
    previousStatus: string;
    newStatus: string;
    changedAt: Date;
  }
  
  export interface PaginatedHistoryResponse {
    content: ReportStatusHistory[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  }
  
  