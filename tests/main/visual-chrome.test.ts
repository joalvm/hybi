import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string): string => readFileSync(path, 'utf8');

type BuildConfig = {
  name?: string;
  version?: string;
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
    nsis?: {
      oneClick?: boolean;
      allowToChangeInstallationDirectory?: boolean;
      installerIcon?: string;
      uninstallerIcon?: string;
    };
    extraResources?: unknown;
  };
};

function icoSizes(path: string): number[] {
  const icon = readFileSync(path);
  const count = icon.readUInt16LE(4);

  return Array.from({ length: count }, (_, index) => {
    const width = icon.readUInt8(6 + index * 16);
    return width === 0 ? 256 : width;
  });
}

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
    expect(config.version).toBe('0.3.0-alpha.5');
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

  it('points every platform at its native icon asset', () => {
    const windowsIcon = 'resources/images/icon.ico';

    expect(config.build?.win?.icon).toBe(windowsIcon);
    expect(config.build?.mac).toMatchObject({
      icon: 'resources/images/icon.png',
      entitlements: 'resources/entitlements.mac.plist',
      entitlementsInherit: 'resources/entitlements.mac.inherit.plist',
    });
    expect(config.build?.linux).toMatchObject({
      icon: 'resources/images/icon.png',
      syncDesktopName: true,
    });
    expect(icoSizes(windowsIcon)).toEqual([16, 24, 32, 48, 64, 128, 256]);
    expect(existsSync(windowsIcon)).toBe(true);
    expect(existsSync('resources/images/icon.png')).toBe(true);
    expect(source('resources/images/icon.svg')).toContain('viewBox="112 112 800 800"');
    expect(source('resources/images/icon.svg')).toContain('fill="#16CBCB"');
    expect(source('resources/images/icon.svg')).toContain('fill="#080D0D"');
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
      installerIcon: 'resources/images/icon.ico',
      uninstallerIcon: 'resources/images/icon.ico',
    });
  });

  /** No artifact reaches a user without the maintainer publishing it by hand. */
  it('signs with the credentials it finds and always drafts the release', () => {
    const workflow = source('.github/workflows/release.yml');

    expect(workflow).toContain('--config.forceCodeSigning=true');
    expect(workflow).toContain('APPLE_API_KEY_B64');
    expect(workflow).toContain('LINUX_GPG_PRIVATE_KEY_B64');
    expect(workflow).toContain('--draft');
    expect(workflow).toContain('--prerelease');
    expect(source('resources/entitlements.mac.plist')).toContain(
      'com.apple.security.cs.disable-library-validation',
    );
    expect(source('resources/entitlements.mac.inherit.plist')).toContain(
      'com.apple.security.cs.disable-library-validation',
    );
  });

  it('composes concise release notes around generated changes and contributors', () => {
    const workflow = source('.github/workflows/release.yml');

    expect(workflow).toContain("cat .github/release-notes/intro.md");
    expect(workflow).toContain("cat .github/release-notes/security.md");
    expect(workflow).toContain("s/^## What's Changed$/## Cambios/");
    expect(workflow).toContain("s/^## New Contributors$/## Contributors/");
    expect(workflow).toContain('gh api "repos/$GH_REPO/releases/generate-notes"');
    expect(workflow).not.toContain('gh api \\"repos/$GH_REPO/releases/generate-notes\\"');
    expect(workflow).not.toContain('## Descargas');
    expect(workflow).not.toContain('release-notes/install.md');
    expect(existsSync('.github/release-notes/security.md')).toBe(true);
    expect(existsSync('.github/release-notes/install.md')).toBe(false);
  });
});
