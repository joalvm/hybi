import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from './app/AppShell.js';
import { WelcomeApp } from './app/WelcomeApp.js';
import { bridge } from './ipc/bridge.js';
import './shared/styles/tokens.css';
import './shared/styles/global.css';
import './shared/styles/overlays.css';

const container = document.getElementById('root');
if (container === null) throw new Error('root container missing');

// The chrome is drawn by the app, so the layout has to know where the system
// still paints: macOS keeps its traffic lights at the top left.
document.documentElement.dataset.platform = bridge.platform;
document.documentElement.dataset.role = bridge.role;

// Both windows load this same bundle. Which one this is was decided by the main
// process, so the renderer never infers it from what it happens to have loaded.
createRoot(container).render(
  <StrictMode>{bridge.role === 'welcome' ? <WelcomeApp /> : <AppShell />}</StrictMode>,
);
