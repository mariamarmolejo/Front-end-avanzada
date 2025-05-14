// src/app/core/models/report.model.ts
import { Category } from './category.model';
import {ImageUploadResponse} from "./Image.upload.request";
import {CommentResponse} from "./comment.model"; // Usamos el modelo completo de Category aquí


export interface Report {
    id?: string;
    title: string;
    description: string;
    categoryList: Category[];
    latitude: number;
    longitude: number;
    importantVotes: number;
  
    reportStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'RESOLVED';
    userId: string;
    createdAt: Date; // <- este es el nuevo campo correcto
  
    images?: ImageUploadResponse[];
    comments?: CommentResponse[]; // Agregado para manejar comentarios
    updatedAt?: Date;
    resolvedAt?: Date;
  }
  