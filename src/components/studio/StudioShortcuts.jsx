'use client';

import { X } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { Kbd } from '@/components/ui/Kbd';
import { useModKey } from '@/hooks/useHotkeys';

export function StudioShortcuts({ open, onClose }) {
  const mod = useModKey();
  const groups = [
    {
      title: 'Review',
      items: [
        ['Move between takes', ['←', '↑', '→', '↓']],
        ['Open take', ['↵']],
        ['Pick / reject (toggle)', ['P', 'X']],
        ['Set as final', ['F']],
        ['Add to comparison', ['C']],
        ['Hide rejected takes', ['H']],
      ],
    },
    {
      title: 'Direct',
      items: [
        ['Render 4 takes, or apply a proposed change', [mod, '↵']],
        ['Branch direction from a take', ['B']],
        ['Edit a field', ['Click', '↵ to save']],
      ],
    },
    {
      title: 'Navigate',
      items: [
        ['Command palette', [mod, 'K']],
        ['Previous / next shot', ['[', ']']],
        ['Focus mode', ['\\']],
        ['Shortcuts', ['?']],
      ],
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} labelledBy="studio-shortcuts-title" className="[--dialog-width:34rem]">
      <div className="max-h-[80vh] overflow-y-auto p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="studio-shortcuts-title" className="text-lg font-semibold">
            Keyboard shortcuts
          </h2>
          <IconButton label="Close shortcuts" icon={X} onClick={onClose} />
        </div>
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.title}>
              <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-ink-3">{group.title}</h3>
              <dl className="divide-y divide-line">
                {group.items.map(([label, keys]) => (
                  <div key={label} className="flex items-center justify-between gap-4 py-2 text-[13px]">
                    <dt>{label}</dt>
                    <dd className="flex shrink-0 gap-1">
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
