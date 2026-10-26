import { StudioShell } from '@/components/studio/StudioShell';
import { getStudioProject } from '@/lib/mock/studio-engine';

export default function StudioPage() {
  return <StudioShell project={getStudioProject()} />;
}
