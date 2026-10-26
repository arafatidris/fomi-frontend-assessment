'use client';

import { useRouter } from 'next/navigation';
import {
  Clapperboard,
  ExternalLink,
  Headset,
  Images,
  Keyboard,
  LogOut,
  Moon,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Menu } from '@/components/ui/Menu';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { CURRENT_USER } from '@/data/user';
import { getTheme, switchTheme } from '@/lib/theme';
import { Logo } from './Logo';
import { NavTabs } from './NavTabs';
import { ThemeToggle } from './ThemeToggle';
import { useWorkspace } from './CreateProvider';

export function TopBar({ onOpenGallery, onOpenShortcuts }) {
  const router = useRouter();
  const { toast } = useToast();
  const { resetDemo } = useWorkspace();

  const supportItems = [
    { label: 'Help center', icon: ExternalLink, href: 'https://fomi.art', external: true },
    { label: 'Keyboard shortcuts', icon: Keyboard, onSelect: onOpenShortcuts, shortcut: '?' },
    {
      label: 'What’s new',
      icon: Sparkles,
      onSelect: () => toast({ title: 'Fomi Studio preview is live', description: 'Open it from your account menu.' }),
    },
  ];

  const accountItems = [
    { label: 'Open Fomi Studio (preview)', icon: Clapperboard, onSelect: () => router.push('/studio') },
    { label: 'Community gallery', icon: Images, onSelect: onOpenGallery },
    { label: 'Toggle theme', icon: Moon, onSelect: () => switchTheme(getTheme() === 'dark' ? 'light' : 'dark') },
    { label: 'Keyboard shortcuts', icon: Keyboard, onSelect: onOpenShortcuts },
    { label: 'Reset demo data', icon: RotateCcw, onSelect: resetDemo },
    { separator: true },
    {
      label: 'Sign out',
      icon: LogOut,
      onSelect: () => toast({ title: 'You’re in the demo workspace', description: 'Signing out is disabled here.' }),
    },
  ];

  return (
    <header className="relative grid h-16 grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:h-[4.75rem] lg:px-10">
      <div className="flex items-center">
        <Logo />
      </div>

      <NavTabs />

      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
        <Button size="sm" icon={Images} onClick={onOpenGallery} className="hidden h-8 md:inline-flex">
          Gallery
        </Button>
        <Menu
          label="Support"
          placement="bottom-end"
          items={supportItems}
          trigger={(props) => (
            <Button {...props} size="sm" icon={Headset} className="hidden h-8 md:inline-flex">
              Support
            </Button>
          )}
        />
        <ThemeToggle className="hidden sm:inline-flex" />
        <Menu
          label="Account"
          placement="bottom-end"
          items={accountItems}
          header={
            <div className="mb-1 flex items-center gap-3 border-b border-line px-2.5 pb-3 pt-1.5">
              <Avatar initials={CURRENT_USER.initials} size={36} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{CURRENT_USER.name}</p>
                <p className="truncate text-xs text-ink-3">{CURRENT_USER.email}</p>
              </div>
              <span className="ml-auto rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-ink">
                {CURRENT_USER.plan}
              </span>
            </div>
          }
          trigger={(props) => (
            <button
              {...props}
              type="button"
              aria-label={`Account: ${CURRENT_USER.name}`}
              className="rounded-full transition-transform duration-150 hover:scale-105 active:scale-95"
            >
              <Avatar initials={CURRENT_USER.initials} />
            </button>
          )}
        />
      </div>
    </header>
  );
}
