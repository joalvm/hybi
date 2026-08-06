import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { cn } from '../utils/cn.js';

type Props = {
  direction: 'row' | 'column';
  initial: number;
  min: number;
  firstCollapsed?: boolean;
  children: [ReactNode, ReactNode];
};

const STEPS: Record<'row' | 'column', Record<string, number | undefined>> = {
  row: { ArrowLeft: -2, ArrowRight: 2 },
  column: { ArrowUp: -2, ArrowDown: 2 },
};

const DIRECTION_CLASSES: Record<Props['direction'], string> = {
  row: 'flex-row',
  column: 'split-column-runtime flex-col',
};

const HANDLE_CLASSES: Record<Props['direction'], string> = {
  row: 'cursor-col-resize',
  column: 'cursor-row-resize',
};

export function SplitPane({ direction, initial, min, firstCollapsed = false, children }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(initial);
  const clamp = (value: number) => Math.min(Math.max(value, min), 100 - min);

  // Pointer capture keeps the drag alive when the cursor outruns the 6px handle,
  // and doubles as the "is dragging" flag so no extra state is needed.
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = container.current?.getBoundingClientRect();
    if (rect === undefined) return;
    const ratio =
      direction === 'row'
        ? ((event.clientX - rect.left) / rect.width) * 100
        : ((event.clientY - rect.top) / rect.height) * 100;
    setSize(clamp(ratio));
  };

  const nudge = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = STEPS[direction][event.key] ?? 0;
    if (delta === 0) return;
    event.preventDefault();
    setSize(clamp(size + delta));
  };

  return (
    <div
      ref={container}
      className={cn('flex h-full min-h-0 min-w-0 w-full', DIRECTION_CLASSES[direction])}
    >
      <div
        className="split-pane-runtime min-h-0 min-w-0 shrink overflow-hidden"
        data-size={firstCollapsed ? '0%' : `${String(size)}%`}
        hidden={firstCollapsed}
      >
        {children[0]}
      </div>
      <div
        className={cn(
          'split-handle-runtime relative shrink-0 basis-px bg-border p-0 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
          HANDLE_CLASSES[direction],
          firstCollapsed && 'hidden',
        )}
        role="separator"
        aria-orientation={direction === 'row' ? 'vertical' : 'horizontal'}
        aria-valuenow={Math.round(size)}
        tabIndex={0}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={move}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onKeyDown={nudge}
      />
      <div
        className="split-pane-runtime min-h-0 min-w-0 shrink overflow-hidden"
        data-size={firstCollapsed ? '100%' : `${String(100 - size)}%`}
      >
        {children[1]}
      </div>
    </div>
  );
}
