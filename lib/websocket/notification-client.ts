import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://8w2syfi6w8.eu-central-1.awsapprunner.com';

export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  timestamp: string;
  userId?: string | null;
  data?: Record<string, unknown> | null;
}

export class NotificationClient {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  /**
   * WebSocket bağlantısını başlat
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Zaten bağlı');
      return;
    }

    const token = Cookies.get('accessToken');
    if (!token) {
      console.warn('[WebSocket] Token bulunamadı, bağlantı kurulamadı');
      return;
    }

    try {
      this.socket = io(`${API_BASE_URL}/notifications`, {
        auth: {
          token,
        },
        query: {
          token, // Query string olarak da gönder (fallback)
        },
        // extraHeaders: {
        //   Authorization: `Bearer ${token}`, // Header olarak da gönder
        // },
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('[WebSocket] Bağlantı hatası:', error);
    }
  }

  /**
   * Event handler'ları kur
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('[WebSocket] Bağlantı kuruldu');
      this.emit('connected', { success: true });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('[WebSocket] Bağlantı kesildi:', reason);
      this.emit('disconnected', { reason });
    });

    this.socket.on('connected', (data) => {
      console.log('[WebSocket] Sunucu bağlantı onayı:', data);
      this.emit('connected', data);
    });

    this.socket.on('notification', (notification: NotificationPayload) => {
      console.log('[WebSocket] Bildirim alındı:', notification);
      this.emit('notification', notification);
    });

    this.socket.on('error', (error) => {
      console.error('[WebSocket] Hata:', error);
      this.emit('error', error);
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      console.error('[WebSocket] Bağlantı hatası:', error.message);
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocket] Maksimum yeniden bağlanma denemesi aşıldı');
        this.disconnect();
      }
    });
  }

  /**
   * Event listener ekle
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Event listener kaldır
   */
  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Event emit (internal)
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WebSocket] Event callback hatası (${event}):`, error);
        }
      });
    }
  }

  /**
   * Test bildirimi gönder
   */
  sendTestNotification(message?: string): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Bağlantı yok, test bildirimi gönderilemedi');
      return;
    }

    this.socket.emit('test-notification', { message: message || 'Test bildirimi' });
  }

  /**
   * Bağlantıyı kes
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('[WebSocket] Bağlantı kapatıldı');
    }
  }

  /**
   * Bağlantı durumunu kontrol et
   */
  getConnectionStatus(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}

// Singleton instance
let notificationClientInstance: NotificationClient | null = null;

export function getNotificationClient(): NotificationClient {
  if (!notificationClientInstance) {
    notificationClientInstance = new NotificationClient();
  }
  return notificationClientInstance;
}
