// src/app/core/models/report.model.ts
import { Category } from './category.model'; // Usamos el modelo completo de Category aquí

export interface ReportImage { // Modelo para las imágenes asociadas
    id: string;
    url: string;
    description?: string; // Opcional
}

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
  
    images?: ReportImage[];
    updatedAt?: Date;
    resolvedAt?: Date;
  }
  