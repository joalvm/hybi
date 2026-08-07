import type { Messages } from '@lang/translate.js';
import type { ConnectionTransport } from '@shared/domain/connections/connection.js';
import type { SettingsTab } from '@/shared/ui/settings/SettingsDialog.js';
import { socketIoSettingsTabs } from '../socketio/settings/tabs.js';
import { webSocketSettingsTabs } from '../websocket/settings/tabs.js';

/**
 * Which groups the settings dialog shows for a transport. The rail is needed
 * before any pane can be rendered, so it is decided here rather than inside the
 * panes — and the switch has to return a list, which is what makes a transport
 * without one a compile error.
 */
export function settingsTabsFor(
  transport: ConnectionTransport,
  messages: Messages,
): SettingsTab[] {
  switch (transport.kind) {
    case 'websocket':
      return webSocketSettingsTabs(messages);
    case 'socketio':
      return socketIoSettingsTabs(messages);
  }
}
