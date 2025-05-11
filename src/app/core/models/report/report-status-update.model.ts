export interface ReportStatusUpdate {
    status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'RESOLVED';
    rejectionMessage?: string | null;
  }