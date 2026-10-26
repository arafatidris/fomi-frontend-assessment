import { GenerationFeed } from '@/components/create/GenerationFeed';
import { listGenerations } from '@/lib/mock/create-engine';

export const metadata = { title: 'Create' };

export default function HomePage() {
  return <GenerationFeed type="all" initialPage={listGenerations({ type: 'all', limit: 6 })} />;
}
