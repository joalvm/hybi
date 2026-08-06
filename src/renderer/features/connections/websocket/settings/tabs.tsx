import type { Messages } from '@lang/translate.js';
import { HeadersIcon, KeepaliveIcon, NetworkIcon, RetryIcon } from '@/shared/ui/icons.js';
import type { SettingsTab } from '@/shared/ui/settings/SettingsDialog.js';

/**
 * The rail of the WebSocket settings dialog, in the order a handshake is built:
 * what is dialled, what is sent with it, and what happens after it is up.
 *
 * Beside the panes rather than inside `WebSocketSettings` because the dialog
 * needs the list before it can render any pane, and a function rather than a
 * constant because the labels are read in whatever language is set.
 */
export function webSocketSettingsTabs(messages: Messages): SettingsTab[] {
  const tabs = messages.connections.tabs;
  return [
    { value: 'connection', label: tabs.connection, icon: <NetworkIcon /> },
    { value: 'headers', label: tabs.headers, icon: <HeadersIcon /> },
    { value: 'retry', label: tabs.retry, icon: <RetryIcon /> },
    { value: 'keepalive', label: tabs.keepalive, icon: <KeepaliveIcon /> },
  ];
}
