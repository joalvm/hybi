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
 * The catalog every other language is measured against. One object per domain,
 * assembled here so a feature imports the group it speaks for and nothing else
 * has to know the file layout.
 */
export const EN = {
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
