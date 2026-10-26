'use client';

import { X } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { Kbd } from '@/components/ui/Kbd';
import { useModKey } from '@/hooks/useHotkeys';

export function ShortcutsDialog({ open, onClose }) {
  const mod = useModKey();
  const groups = [
    {
      title: 'Create',
      items: [
        ['Focus the prompt', ['/']],
        ['Generate', [mod, '↵']],
        ['Show shortcuts', ['?']],
      ],
    },
    {
      title: 'Viewer',
      items: [
        ['Previous / next output', ['←', '→']],
        ['Save to favorites', ['F']],
        ['Close', ['Esc']],
      ],
    },
    {
      title: 'Lists & menus',
      items: [
        ['Move between items', ['←', '→']],
        ['Open / choose', ['↵']],
        ['Jump to first / last', ['Home', 'End']],
      ],
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} labelledBy="shortcuts-title" className="[--dialog-width:30rem]">
      <div className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="shortcuts-title" className="text-lg font-semibold">
            Keyboard shortcuts
          </h2>
          <IconButton label="Close shortcuts" icon={X} onClick={onClose} />
        </div>
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.title}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-2">{group.title}</h3>
              <dl className="divide-y divide-line">
                {group.items.map(([label, keys]) => (
                  <div key={label} className="flex items-center justify-between py-2 text-sm">
                    <dt className="text-ink">{label}</dt>
                    <dd className="flex gap-1">
                      {keys.map((key) => (
                        <Kbd key={key}>{key}</Kbd>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </Dialog>
  );
}
