import { useMessages } from '@/shared/i18n/useMessages.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { HideCatalogIcon, ShowCatalogIcon } from '@/shared/ui/icons.js';

type Props = {
  catalogVisible: boolean;
  onToggleCatalog: () => void;
};

/** Desktop status bar keeps layout controls reachable without stealing workspace height. */
export function StatusBar({ catalogVisible, onToggleCatalog }: Props) {
  const messages = useMessages().chrome;
  const label = catalogVisible ? messages.hideCatalog : messages.showCatalog;
  const CatalogIcon = catalogVisible ? HideCatalogIcon : ShowCatalogIcon;

  return (
    <footer
      className="flex h-statusbar shrink-0 items-center border-t border-border bg-chrome text-muted"
      data-part="status-bar"
    >
      <div
        className="flex h-full min-w-0 shrink-0 items-center pl-2 pr-0"
        data-part="status-bar-leading"
      >
        <IconButton
          label={label}
          controls="catalog-rail"
          expanded={catalogVisible}
          className="h-full min-h-0 min-w-control rounded-none px-1"
          onClick={onToggleCatalog}
        >
          <CatalogIcon size={16} />
        </IconButton>
      </div>
      <div className="min-w-0 flex-1 px-1" data-part="status-bar-center" />
      <div className="flex h-full items-center px-1" data-part="status-bar-trailing" />
    </footer>
  );
}
