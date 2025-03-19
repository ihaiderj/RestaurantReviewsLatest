export interface LoginRequest {
  email_or_username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'CUSTOMER' | 'OWNER' | 'ADMIN';
  phone_number: string;
  profile_picture: string | null;
  about_me: string;
  gender: 'M' | 'F' | 'O' | 'N';
  gender_display: string;
}

export interface LoginResponse {
  status: 'success';
  access: string;
  refresh: string;
  user: User;
}

export interface LoginError {
  error: {
    email_or_username?: string[];
    error?: string;
  };
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
}

export interface SocialLoginResponse {
  status: string;
  user: User;
  access: string;
  refresh: string;
  message: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  user_type: 'CUSTOMER' | 'OWNER';
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  about_me?: string;
  gender?: 'M' | 'F' | 'O' | 'N';
}

export interface RegisterResponse {
  user: User;
  message: string;
}

export interface ProfileResponse {
  status: 'success';
  user: User;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  about_me?: string;
  gender?: 'M' | 'F' | 'O' | 'N';
  profile_picture?: File;
}

export interface UpdateProfileResponse {
  status: 'success';
  message: string;
  user: User;
}

export interface ProfileError {
  status: 'error';
  errors: {
    [key: string]: string[];
  };
} 