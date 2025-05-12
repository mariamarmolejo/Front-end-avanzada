export interface Category {
    id?: string;
    name: string;
    description: string;
    createdAt?: Date;
    activated: boolean;
}

export interface CategoryRequest {
    name: string;
    description?: string;
  }
  