import type { Messages } from '@lang/translate.js';
import {
  HeadersIcon,
  KeyIcon,
  NetworkIcon,
  RetryIcon,
  SlidersIcon,
} from '@/shared/ui/icons.js';
import type { SettingsTab } from '@/shared/ui/settings/SettingsDialog.js';

/**
 * The rail of the Socket.IO settings dialog, in the order a connection is built:
 * where it lands, what it proves on arrival, what rides along, and what happens
 * afterwards.
 */
export function socketIoSettingsTabs(messages: Messages): SettingsTab[] {
  const tabs = messages.connections.tabs;
  return [
    { value: 'connection', label: tabs.connection, icon: <NetworkIcon /> },
    { value: 'auth', label: tabs.auth, icon: <KeyIcon /> },
    { value: 'headers', label: tabs.headers, icon: <HeadersIcon /> },
    { value: 'retry', label: tabs.retry, icon: <RetryIcon /> },
    { value: 'advanced', label: tabs.advanced, icon: <SlidersIcon /> },
  ];
}
