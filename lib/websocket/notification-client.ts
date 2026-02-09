import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

    // Teşhis için detaylı loglar
    const socketUrl = `${API_BASE_URL}/notifications`;
    console.log('[WebSocket] Bağlantı başlatılıyor...');
    console.log('[WebSocket] API_BASE_URL:', API_BASE_URL);
    console.log('[WebSocket] Socket URL:', socketUrl);
    console.log('[WebSocket] Token var mı:', !!token);
    console.log('[WebSocket] Token uzunluğu:', token.length);
    console.log('[WebSocket] Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    });

    try {
      // AWS App Runner WebSocket desteği için polling'i önce dene
      // WebSocket başarısız olursa otomatik polling'e geçer
      this.socket = io(socketUrl, {
        auth: {
          token,
        },
        query: {
          token, // Query string olarak da gönder (fallback)
        },
        extraHeaders: {
          Authorization: `Bearer ${token}`, // Header olarak da gönder
        },
        // Polling'i önce dene (AWS App Runner WebSocket desteği için)
        // WebSocket başarısız olursa otomatik polling'e geçer
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000, // 20 saniye timeout
        forceNew: false,
        upgrade: true,
      });

      console.log('[WebSocket] Socket instance oluşturuldu:', {
        id: this.socket.id,
        connected: this.socket.connected,
        disconnected: this.socket.disconnected,
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('[WebSocket] Bağlantı hatası (catch):', error);
      console.error('[WebSocket] Hata detayları:', {
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        stack: error instanceof Error ? error.stack : undefined,
        error: error,
      });
    }
  }

  /**
   * Event handler'ları kur
   */
  private setupEventHandlers(): void {
    if (!this.socket) {
      console.error('[WebSocket] Socket instance yok, event handler kurulamadı');
      return;
    }

    console.log('[WebSocket] Event handler\'lar kuruluyor...');

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('[WebSocket] ✅ Bağlantı kuruldu');
      console.log('[WebSocket] Socket ID:', this.socket?.id);
      console.log('[WebSocket] Transport:', this.socket?.io?.engine?.transport?.name);
      this.emit('connected', { success: true });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('[WebSocket] ❌ Bağlantı kesildi:', reason);
      console.log('[WebSocket] Disconnect detayları:', {
        reason,
        socketId: this.socket?.id,
        wasConnected: this.isConnected,
      });
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
      console.error('[WebSocket] ⚠️ Hata eventi:', error);
      console.error('[WebSocket] Hata detayları:', {
        message: error instanceof Error ? error.message : String(error),
        error: error,
        socketId: this.socket?.id,
        connected: this.socket?.connected,
      });
      this.emit('error', error);
    });

    this.socket.on('connect_error', (error: Error & { type?: string; description?: string; context?: any }) => {
      this.reconnectAttempts++;
      console.error('[WebSocket] ⚠️ Bağlantı hatası (connect_error):', error.message);
      console.error('[WebSocket] Connect error detayları:', {
        message: error.message,
        type: error.type || 'unknown',
        description: error.description || 'no description',
        context: error.context || null,
        socketId: this.socket?.id,
        reconnectAttempts: this.reconnectAttempts,
        maxReconnectAttempts: this.maxReconnectAttempts,
        transport: this.socket?.io?.engine?.transport?.name,
        readyState: this.socket?.io?.engine?.readyState,
      });
      
      // Socket.io engine durumunu kontrol et
      if (this.socket?.io?.engine) {
        const engine = this.socket.io.engine;
        console.error('[WebSocket] Engine durumu:', {
          transport: engine.transport?.name,
          readyState: engine.readyState,
        });
      }

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocket] ❌ Maksimum yeniden bağlanma denemesi aşıldı');
        this.disconnect();
      } else {
        console.log(`[WebSocket] 🔄 Yeniden bağlanma denemesi ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      }
    });

    // Ek event handler'lar
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[WebSocket] 🔄 Yeniden bağlandı, deneme sayısı:', attemptNumber);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[WebSocket] 🔄 Yeniden bağlanma denemesi:', attemptNumber);
    });

    this.socket.on('reconnect_error', (error: Error & { type?: string; description?: string }) => {
      console.error('[WebSocket] ⚠️ Yeniden bağlanma hatası:', error);
      console.error('[WebSocket] Reconnect error detayları:', {
        message: error.message,
        type: error.type || 'unknown',
        description: error.description || 'no description',
      });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[WebSocket] ❌ Yeniden bağlanma başarısız oldu');
    });

    // Ping durumunu izle (pong event manager'da yok, kaldırıldı)
    // Ping/Pong otomatik olarak socket.io tarafından yönetiliyor

    console.log('[WebSocket] Event handler\'lar kuruldu');
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
