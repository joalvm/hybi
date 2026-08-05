import type { StartupBehavior } from '@shared/preferences/types.js';
import { SelectField } from '@/shared/ui/SelectField.js';

const STARTUP_OPTIONS = [
  { value: 'welcome', label: 'Mostrar la bienvenida' },
  { value: 'last-workspace', label: 'Abrir el último workspace' },
];

type Props = { startup: StartupBehavior; onStartupChange: (startup: StartupBehavior) => void };

/** Read by the main process before any window exists, so it applies next launch. */
export function StartupSection({ startup, onStartupChange }: Props) {
  return (
    <div className="flex flex-col">
      <SelectField
        label="Al arrancar"
        description="La bienvenida es donde se elige, se crea y se duplica un workspace."
        value={startup}
        options={STARTUP_OPTIONS}
        onChange={(value) => {
          onStartupChange(value as StartupBehavior);
        }}
      />
    </div>
  );
}
