// src/app/models/user-response.model.ts
export interface UserResponse {
    id: number;
    fullName: string;
    email: string;
    dateBirth: string;
    cityOfResidence: string;
    notificationRadiusKm: number;
    latitude: number;
    longitude: number;
  }
  