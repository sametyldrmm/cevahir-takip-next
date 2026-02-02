import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - Token ekle
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor - Token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // 401 hatası ve token refresh denenmemişse
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
              this.clearTokens();
              window.location.href = '/login';
              return Promise.reject(error);
            }

            // Refresh token ile yeni access token al
            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              { refreshToken },
            );

            const { accessToken, refreshToken: newRefreshToken } =
              response.data;

            this.setTokens(accessToken, newRefreshToken);

            // Orijinal isteği yeni token ile tekrar dene
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh başarısız - logout
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return Cookies.get('accessToken') || null;
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return Cookies.get('refreshToken') || null;
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    Cookies.set('accessToken', accessToken, {
      expires: 1, // 1 gün
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    Cookies.set('refreshToken', refreshToken, {
      expires: 7, // 7 gün
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  private clearTokens(): void {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
  }

  // Public methods
  setAuthTokens(accessToken: string, refreshToken: string): void {
    this.setTokens(accessToken, refreshToken);
  }

  clearAuthTokens(): void {
    this.clearTokens();
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();






