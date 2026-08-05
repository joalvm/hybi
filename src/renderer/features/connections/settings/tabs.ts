import type { ConnectionTransport } from '@shared/domain/connections/connection.js';
import type { SettingsTab } from '@/shared/ui/settings/SettingsDialog.js';
import { WEBSOCKET_SETTINGS_TABS } from '../websocket/settings/tabs.js';

/**
 * Which groups the settings dialog shows for a transport. There is no dispatch
 * yet because there is nothing to dispatch on: `ConnectionTransport` has one
 * member, and a one-member union cannot be narrowed — `no-unnecessary-condition`
 * rejects the guard as always true. Adding a transport is what makes the branch
 * legal, and `TransportFactoryMap` is what will refuse to compile until it
 * exists.
 */
export function settingsTabsFor(_transport: ConnectionTransport): SettingsTab[] {
  return WEBSOCKET_SETTINGS_TABS;
}
