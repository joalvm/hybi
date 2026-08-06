import type { Messages } from '../types.js';
import about from './about.json';
import activity from './activity.json';
import catalog from './catalog.json';
import chrome from './chrome.json';
import common from './common.json';
import composer from './composer.json';
import connections from './connections.json';
import exceptions from './exceptions.json';
import menu from './menu.json';
import preferences from './preferences.json';
import validation from './validation.json';
import welcome from './welcome.json';
import workspace from './workspace.json';

/**
 * Annotated rather than inferred: this is what turns a key Spanish has not
 * answered for into a build error instead of a blank label in the interface.
 */
export const ES: Messages = {
  about,
  activity,
  catalog,
  chrome,
  common,
  composer,
  connections,
  exceptions,
  menu,
  preferences,
  validation,
  welcome,
  workspace,
};
