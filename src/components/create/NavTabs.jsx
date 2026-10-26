'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils/cn';
import { NavIcon } from './NavIcons';

export const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/image', label: 'Image', icon: 'image' },
  { href: '/video', label: 'Video', icon: 'video' },
  { href: '/edit', label: 'Edit', icon: 'edit' },
  { href: '/assets', label: 'Assets', icon: 'assets' },
];

const isActive = (pathname, href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

/**
 * Primary navigation. The coral indicator slides along a track above the
 * icons (as in the design) and the active glyph fills in.
 */
export function NavTabs({ className }) {
  const pathname = usePathname();
  const activeIndex = Math.max(0, NAV_ITEMS.findIndex((item) => isActive(pathname, item.href)));

  return (
    <nav aria-label="Workspace" className={cn('relative', className)}>
      <div aria-hidden className="absolute inset-x-1 top-0 h-[5px] rounded-full bg-panel-2">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-accent shadow-[0_1px_6px_color-mix(in_oklab,var(--c-accent)_55%,transparent)] transition-transform duration-500 ease-spring motion-reduce:transition-none"
          style={{ width: `${100 / NAV_ITEMS.length}%`, transform: `translateX(${activeIndex * 100}%)` }}
        />
      </div>
      <ul className="grid grid-cols-5 pt-2.5">
        {NAV_ITEMS.map((item, index) => {
          const active = index === activeIndex;
          return (
            <li key={item.href} className="flex justify-center">
              <Tooltip content={item.label} side="bottom">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group flex h-10 w-12 items-center justify-center rounded-xl transition-colors duration-200 sm:w-14 lg:w-16',
                    active ? 'text-ink' : 'text-ink-2 hover:bg-panel-2/60 hover:text-ink',
                  )}
                >
                  <NavIcon
                    name={item.icon}
                    filled={active}
                    className="size-[22px] transition-transform duration-300 ease-spring group-hover:-translate-y-px group-active:scale-90"
                  />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
