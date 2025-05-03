// src/app/core/models/report-request.model.ts

import {Category} from "./category.model";

export interface ReportRequest {
    title: string;
    description: string;
    categoryList?: Category[];
    latitude: number;
    longitude: number;
    // Las imágenes se manejarán por separado (FormData)
}