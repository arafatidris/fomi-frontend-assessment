import { GenerationFeed } from '@/components/create/GenerationFeed';
import { listGenerations } from '@/lib/mock/create-engine';

export const metadata = { title: 'Image' };

export default function ImagePage() {
  return <GenerationFeed type="image" initialPage={listGenerations({ type: 'image', limit: 6 })} />;
}
