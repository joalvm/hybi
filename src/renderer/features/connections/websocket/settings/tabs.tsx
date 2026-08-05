import { HeadersIcon, KeepaliveIcon, NetworkIcon, RetryIcon } from '@/shared/ui/icons.js';
import type { SettingsTab } from '@/shared/ui/settings/SettingsDialog.js';

/**
 * The rail of the WebSocket settings dialog, in the order a handshake is built:
 * what is dialled, what is sent with it, and what happens after it is up.
 *
 * Beside the panes rather than inside `WebSocketSettings` because the dialog
 * needs the list before it can render any pane.
 */
export const WEBSOCKET_SETTINGS_TABS: SettingsTab[] = [
  { value: 'connection', label: 'Conexión', icon: <NetworkIcon /> },
  { value: 'headers', label: 'Cabeceras', icon: <HeadersIcon /> },
  { value: 'retry', label: 'Reintentos', icon: <RetryIcon /> },
  { value: 'keepalive', label: 'Keepalive', icon: <KeepaliveIcon /> },
];
