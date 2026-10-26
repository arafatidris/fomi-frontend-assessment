import { GenerationFeed } from '@/components/create/GenerationFeed';
import { listGenerations } from '@/lib/mock/create-engine';

export const metadata = { title: 'Video' };

export default function VideoPage() {
  return <GenerationFeed type="video" initialPage={listGenerations({ type: 'video', limit: 6 })} />;
}
