// src/app/models/user-registration.model.ts
export interface UserRegistration {
    fullName: string;
    email: string;
    password: string;
    dateBirth: string;          // 'YYYY-MM-DD'
    cityOfResidence: string;
    notificationRadiusKm: number;
    latitude: number;
    longitude: number;
  }