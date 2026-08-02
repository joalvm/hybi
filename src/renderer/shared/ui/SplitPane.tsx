import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';

type Props = {
  direction: 'row' | 'column';
  initial: number;
  min: number;
  children: [ReactNode, ReactNode];
};

const STEPS: Record<'row' | 'column', Record<string, number | undefined>> = {
  row: { ArrowLeft: -2, ArrowRight: 2 },
  column: { ArrowUp: -2, ArrowDown: 2 },
};

export function SplitPane({ direction, initial, min, children }: Props) {
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
    <div ref={container} className={`split split--${direction}`}>
      <div className="split-pane" style={{ flexBasis: `${String(size)}%` }}>
        {children[0]}
      </div>
      <div
        className="split-handle"
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
      <div className="split-pane" style={{ flexBasis: `${String(100 - size)}%` }}>
        {children[1]}
      </div>
    </div>
  );
}
