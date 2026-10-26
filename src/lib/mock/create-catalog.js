import 'server-only';
import { STYLE_PRESETS } from '@/data/create/styles';
import { COMMUNITY_PICKS } from '@/data/create/community';
import { getMedia } from '@/lib/media/manifest';
import { listGenerations } from './create-engine';

const thumb = (key) => {
  const media = getMedia(key);
  return { src: media.src, width: media.width, height: media.height, blurDataURL: media.blurDataURL };
};

/** Everything the Create shell needs on first paint, resolved on the server. */
export function getCreateCatalog() {
  return {
    history: listGenerations({ type: 'all', limit: 100 }).items,
    styles: STYLE_PRESETS.map(({ id, label, thumb: key }) => ({ id, label, thumb: thumb(key) })),
    community: COMMUNITY_PICKS.map((pick) => ({ ...pick, id: pick.media, media: thumb(pick.media) })),
  };
}
