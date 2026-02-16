import { apiClient } from '../api-client';

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
  displayName?: string;
  userTitle?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.getClient().post<AuthResponse>(
      '/auth/login',
      dto,
    );
    
    // Token'ları kaydet
    apiClient.setAuthTokens(
      response.data.accessToken,
      response.data.refreshToken,
    );
    
    return response.data;
  },

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const response = await apiClient.getClient().post<AuthResponse>(
      '/auth/register',
      dto,
    );
    
    // Token'ları kaydet
    apiClient.setAuthTokens(
      response.data.accessToken,
      response.data.refreshToken,
    );
    
    return response.data;
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.getClient().post<AuthResponse>(
      '/auth/refresh',
      { refreshToken },
    );
    
    // Yeni token'ları kaydet
    apiClient.setAuthTokens(
      response.data.accessToken,
      response.data.refreshToken,
    );
    
    return response.data;
  },

  logout(): void {
    apiClient.clearAuthTokens();
  },

  // Kullanıcı profil bilgilerini getir
  async getProfile(): Promise<User> {
    const response = await apiClient.getClient().get<User>('/auth/me');
    return response.data;
  },

  async changePassword(dto: ChangePasswordDto): Promise<void> {
    await apiClient.getClient().post('/auth/me/password', dto);
  },
};

