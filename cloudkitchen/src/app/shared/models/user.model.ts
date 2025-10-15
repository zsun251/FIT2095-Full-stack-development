// User model matching MongoDB User schema
export interface User {
  _id?: string;
  userId: string;
  email: string;
  password?: string;
  fullname: string;
  role: 'admin' | 'chef' | 'manager';
  phone: string;
  isLoggedIn: boolean;
  lastLoginDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullname: string;
  role: 'admin' | 'chef' | 'manager';
  phone: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  error?: string;
}
