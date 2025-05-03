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
    categoryList: Category[]; // Lista de categorías completas
    latitude: number;
    longitude: number;
    status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'RESOLVED' | 'INACTIVE'; // Posibles estados
    reporterId: string; // ID del usuario que reportó
    images?: ReportImage[]; // Lista de imágenes
    createdAt: Date;
    updatedAt?: Date;
    resolvedAt?: Date;
}