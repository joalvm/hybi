import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string): string => readFileSync(path, 'utf8');

type BuildConfig = {
  name?: string;
  desktopName?: string;
  build?: {
    appId?: string;
    productName?: string;
    directories?: { buildResources?: string };
    files?: string[];
    asar?: boolean;
    electronFuses?: Record<string, boolean>;
    win?: { icon?: string };
    mac?: { icon?: string; entitlements?: string; entitlementsInherit?: string };
    linux?: { icon?: string; syncDesktopName?: boolean };
    nsis?: { oneClick?: boolean; allowToChangeInstallationDirectory?: boolean };
    extraResources?: unknown;
  };
};

/**
 * The packaging contract. Unlike a stylesheet, this genuinely is text — the
 * values here are what electron-builder reads, so asserting on them is
 * asserting on behaviour rather than on how a rule happens to be written.
 *
 * Colours, spacing and markup used to be checked here too, by grepping the
 * source. That locked formatting instead of appearance and broke on every
 * refactor, so it now lives where it can be observed: the renderer tests and
 * the Playwright runs, which read computed styles from a real window.
 */
describe('Hybi packaging', () => {
  const config = JSON.parse(source('package.json')) as BuildConfig;

  it('ships under the Hybi identity', () => {
    expect(config.name).toBe('hybi');
    expect(config.desktopName).toBe('hybi');
    expect(config.build?.appId).toBe('com.hybi.desktop');
    expect(config.build?.productName).toBe('Hybi');
    expect(source('src/renderer/index.html')).toContain('<title>Hybi</title>');
  });

  it('packs only the build output, from the resources directory', () => {
    expect(config.build?.directories?.buildResources).toBe('resources');
    expect(config.build?.files).toEqual(['out/**', '!out/**/*.map']);
    expect(config.build?.asar).toBe(true);
    expect(config.build?.extraResources).toBeUndefined();
  });

  it('points every platform at the one icon that ships with the repository', () => {
    expect(config.build?.win?.icon).toBe('resources/images/icon.png');
    expect(config.build?.mac).toMatchObject({
      icon: 'resources/images/icon.png',
      entitlements: 'resources/entitlements.mac.plist',
      entitlementsInherit: 'resources/entitlements.mac.inherit.plist',
    });
    expect(config.build?.linux).toMatchObject({
      icon: 'resources/images/icon.png',
      syncDesktopName: true,
    });
    // electron-builder rasterises every native format from the PNG; the SVG is
    // the editable source the renderer and the future landing page share.
    expect(existsSync('resources/images/icon.png')).toBe(true);
    expect(existsSync('resources/images/icon.svg')).toBe(true);
  });

  it('keeps the hardening fuses closed in the shipped binary', () => {
    expect(config.build?.electronFuses).toMatchObject({
      runAsNode: false,
      enableCookieEncryption: true,
      enableNodeOptionsEnvironmentVariable: false,
      enableNodeCliInspectArguments: false,
      enableEmbeddedAsarIntegrityValidation: true,
      onlyLoadAppFromAsar: true,
    });
  });

  it('installs where the user chooses instead of silently', () => {
    expect(config.build?.nsis).toMatchObject({
      oneClick: false,
      allowToChangeInstallationDirectory: true,
    });
  });

  /** No artifact reaches a user without the maintainer publishing it by hand. */
  it('signs with the credentials it finds and always drafts the release', () => {
    const workflow = source('.github/workflows/release.yml');

    expect(workflow).toContain('--config.forceCodeSigning=true');
    expect(workflow).toContain('APPLE_API_KEY_B64');
    expect(workflow).toContain('LINUX_GPG_PRIVATE_KEY_B64');
    expect(workflow).toContain('--draft');
    expect(source('resources/entitlements.mac.plist')).toContain(
      'com.apple.security.cs.disable-library-validation',
    );
    expect(source('resources/entitlements.mac.inherit.plist')).toContain(
      'com.apple.security.cs.disable-library-validation',
    );
  });
});
