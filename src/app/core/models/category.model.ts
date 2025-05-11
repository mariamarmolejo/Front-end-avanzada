export interface Category {
    id?: string;
    name: string;
    description: string;
    createdAt?: Date;
}

export interface CategoryRequest {
    name: string;
    description?: string;
  }
  