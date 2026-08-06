import { WebSocket, type RawData } from 'ws';
import type { ResolvedWebSocketTransport } from '@shared/transport/websocket.js';
import { mainMessages } from '../../lang.js';
import { startKeepalive } from './keepalive.js';

export type WebSocketAttempt = {
  socket: WebSocket;
  stopKeepalive: (() => void) | null;
};

type AttemptCallbacks = {
  isCurrent(attempt: WebSocketAttempt): boolean;
  open(attempt: WebSocketAttempt): void;
  message(attempt: WebSocketAttempt, data: RawData, isBinary: boolean): void;
  error(attempt: WebSocketAttempt, error: Error): void;
  close(attempt: WebSocketAttempt, code: number, reason: string): void;
};

/** Creates one socket attempt and binds every listener to that exact owner. */
export function createWebSocketAttempt(
  url: URL,
  target: ResolvedWebSocketTransport,
  callbacks: AttemptCallbacks,
): { attempt: WebSocketAttempt; opened: Promise<void> } {
  const socket = new WebSocket(url, target.protocols, {
    headers: target.headers,
    rejectUnauthorized: target.verifyCertificate,
    maxPayload: target.maxMessageBytes,
  });
  const attempt: WebSocketAttempt = { socket, stopKeepalive: null };
  let didOpen = false;

  socket.on('message', (data: RawData, isBinary: boolean) => {
    callbacks.message(attempt, data, isBinary);
  });
  socket.on('error', (error: Error) => {
    callbacks.error(attempt, error);
  });
  socket.on('close', (code: number, reason: Buffer) => {
    callbacks.close(attempt, code, reason.toString('utf8'));
  });

  const opened = new Promise<void>((resolve, reject) => {
    socket.once('open', () => {
      if (!callbacks.isCurrent(attempt)) {
        reject(new Error(mainMessages().exceptions.connectionSuperseded));
        return;
      }
      didOpen = true;
      attempt.stopKeepalive = startKeepalive(socket, target.keepalive);
      callbacks.open(attempt);
      resolve();
    });
    socket.once('error', reject);
    socket.once('close', () => {
      if (!didOpen) reject(new Error(mainMessages().exceptions.connectionClosedEarly));
    });
  });
  return { attempt, opened };
}

/** Invalidates an attempt without waiting for a close handshake. */
export function disposeWebSocketAttempt(attempt: WebSocketAttempt): void {
  attempt.stopKeepalive?.();
  attempt.stopKeepalive = null;
  attempt.socket.terminate();
}
