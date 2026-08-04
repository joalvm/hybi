import {
  ArrowDown,
  ArrowUp,
  Braces,
  Check,
  ChevronDown,
  ClipboardPaste,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  CircleCheck,
  CircleX,
  Copy,
  Download,
  Eye,
  EyeOff,
  Folder,
  FolderPlus,
  Import,
  LoaderCircle,
  Menu as MenuGlyph,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
  Save,
  SendHorizontal,
  Settings,
  ShieldAlert,
  Scissors,
  Square,
  Sun,
  Trash2,
  WandSparkles,
  X,
  Moon,
  type LucideIcon,
  type LucideProps,
  ListFilter,
} from 'lucide-react';

/**
 * Every glyph in the app is named here, so weight and size are decided once
 * instead of per button. Lucide draws on a 24px grid at stroke 2, which turns
 * into a blob once scaled to a 26px control: `absoluteStrokeWidth` pins the line
 * to 1.25px on screen at any size, which is the hairline this UI is drawn in.
 *
 * Icons are decorative — every control that carries one also carries an
 * `aria-label` — so they stay out of the accessibility tree.
 */
const HAIRLINE: LucideProps = {
  size: 14,
  strokeWidth: 1,
  absoluteStrokeWidth: true,
  'aria-hidden': true,
  focusable: false,
};

/** Props still win over the defaults, so one caller can ask for a larger glyph. */
function hairline(Glyph: LucideIcon) {
  return function Icon(props: LucideProps) {
    return <Glyph {...HAIRLINE} {...props} />;
  };
}

/** Closes a dialog, a pane or a tab. */
export const CloseIcon = hairline(X);
/** Opens the application menu from the chrome, where no menu bar is drawn. */
export const MenuBarIcon = hairline(MenuGlyph);
/** Window controls: the desktop convention of line, square and stacked squares. */
export const WindowMinimizeIcon = hairline(Minus);
/** Maximizes a window. */
export const WindowMaximizeIcon = hairline(Square);
/** Restores a window to its previous size. */
export const WindowRestoreIcon = hairline(Copy);
/** Discards a list. */
export const TrashIcon = hairline(Trash2);
/** The braces of `{{variable}}`: the button opens the environment editor. */
export const BracesIcon = hairline(Braces);
/** Writes the draft back into the catalog. */
export const SaveIcon = hairline(Save);
/** Adds a connection tab. */
export const PlusIcon = hairline(Plus);
/** Adds a collection to the catalog. */
export const NewCollectionIcon = hairline(FolderPlus);
/** Reads an AsyncAPI document into the catalog. */
export const ImportIcon = hairline(Import);
/** Writes the complete workspace as an AsyncAPI JSON document. */
export const ExportIcon = hairline(Download);
/** Work already running: an import parsing a document, and nothing else so far. */
export const SpinnerIcon = hairline(LoaderCircle);
/** The `…` a row shows instead of a strip of buttons. */
export const MoreIcon = hairline(MoreHorizontal);
/** An expanded collection. */
export const CaretDownIcon = hairline(ChevronDown);
/** A collapsed collection. */
export const CaretRightIcon = hairline(ChevronRight);
/** Folds every collection shut. */
export const CollapseAllIcon = hairline(ChevronsDownUp);
/** Opens every collection back up. */
export const ExpandAllIcon = hairline(ChevronsUpDown);
/** Shows a masked secret. */
export const RevealIcon = hairline(Eye);
/** Masks a secret again. */
export const HideIcon = hairline(EyeOff);
/** Renames a row in place. */
export const RenameIcon = hairline(Pencil);
/** Copies an event, or the editor's selection. */
export const DuplicateIcon = hairline(Copy);
/** Cuts the editor's selection. */
export const CutIcon = hairline(Scissors);
/** Pastes over the editor's selection. */
export const PasteIcon = hairline(ClipboardPaste);
/** A move target in a row menu. */
export const CollectionIcon = hairline(Folder);
/** Marks the workspace currently open. */
export const CheckIcon = hairline(Check);
/** Puts the payload on the wire. */
export const SendIcon = hairline(SendHorizontal);
/** Re-indents a payload that arrived on one line. */
export const BeautifyIcon = hairline(WandSparkles);
/** A frame this client sent. */
export const OutgoingIcon = hairline(ArrowUp);
/** A frame the peer sent. */
export const IncomingIcon = hairline(ArrowDown);
/** A lifecycle note: opened, closed, reconnecting. */
export const StatusIcon = hairline(CircleCheck);
/** A failure, on the socket or in the app. */
export const ErrorIcon = hairline(CircleX);
/** Filters event names in the catalog. */
export const SearchIcon = hairline(ListFilter);
/** Opens how a connection is dialled: headers, subprotocols, retry, keepalive. */
export const SettingsIcon = hairline(Settings);
/** Marks a setting that weakens the connection's own defences. */
export const ShieldAlertIcon = hairline(ShieldAlert);
/** Switches the QA theme to the light palette. */
export const SunIcon = hairline(Sun);
/** Switches the QA theme to the dark palette. */
export const MoonIcon = hairline(Moon);
