import type { Affiliation } from '../affiliations/types.js';
import type { Contributor } from '../contributors/types.js';
import type { Funding } from '../funding/types.js';
import type { Venue } from '../venues/types.js';

export type SiteFrontmatter = {
  title?: string;
  description?: string;
  subtitle?: string;
  short_title?: string;
  thumbnail?: string | null;
  thumbnailOptimized?: string;
  banner?: string | null;
  bannerOptimized?: string;
  authors?: Contributor[];
  affiliations?: Affiliation[];
  venue?: Venue;
  github?: string;
  keywords?: string[];
  funding?: Funding[];
  contributors?: Contributor[];
  options?: Record<string, any>;
};
