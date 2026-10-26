import { Poppins } from 'next/font/google';
import { CreateShell } from '@/components/create/CreateShell';
import { getCreateCatalog } from '@/lib/mock/create-catalog';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export default function CreateLayout({ children }) {
  const catalog = getCreateCatalog();
  return (
    <div data-product="create" className={`${poppins.variable} min-h-dvh bg-canvas font-sans text-ink [--font-ui:var(--font-poppins)]`}>
      <CreateShell catalog={catalog}>{children}</CreateShell>
    </div>
  );
}
