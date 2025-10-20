import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

export interface SpeechGeneratingEvent {
  message: string;
}

export interface SpeechReadyEvent {
  audioUrl: string;
  recipeId: string;
}

export interface SpeechErrorEvent {
  error: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private readonly SOCKET_URL = window.location.origin;

  constructor() {
    this.socket = io(this.SOCKET_URL, {
      autoConnect: false,
      withCredentials: true
    });
  }

  /**
   * Connect to Socket.IO server
   */
  connect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket.connected;
  }

  /**
   * Request text-to-speech generation for a recipe
   * @param recipeId Recipe ID
   */
  generateSpeech(recipeId: string): void {
    this.socket.emit('generate-speech', { recipeId });
  }

  /**
   * Listen for speech generation progress
   */
  onSpeechGenerating(): Observable<SpeechGeneratingEvent> {
    return new Observable(observer => {
      this.socket.on('speech-generating', (data: SpeechGeneratingEvent) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('speech-generating');
      };
    });
  }

  /**
   * Listen for speech ready event
   */
  onSpeechReady(): Observable<SpeechReadyEvent> {
    return new Observable(observer => {
      this.socket.on('speech-ready', (data: SpeechReadyEvent) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('speech-ready');
      };
    });
  }

  /**
   * Listen for speech error event
   */
  onSpeechError(): Observable<SpeechErrorEvent> {
    return new Observable(observer => {
      this.socket.on('speech-error', (data: SpeechErrorEvent) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('speech-error');
      };
    });
  }

  /**
   * Listen for connection event
   */
  onConnect(): Observable<void> {
    return new Observable(observer => {
      this.socket.on('connect', () => {
        observer.next();
      });

      return () => {
        this.socket.off('connect');
      };
    });
  }

  /**
   * Listen for disconnect event
   */
  onDisconnect(): Observable<void> {
    return new Observable(observer => {
      this.socket.on('disconnect', () => {
        observer.next();
      });

      return () => {
        this.socket.off('disconnect');
      };
    });
  }
}
