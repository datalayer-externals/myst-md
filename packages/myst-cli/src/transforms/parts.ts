import type { Block } from 'myst-spec-ext';
import type { ISession } from '../index.js';
import { parseMyst } from '../index.js';
import type { GenericParent } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';

export function frontmatterPartsTransform(
  session: ISession,
  file: string,
  mdast: GenericParent,
  frontmatter: PageFrontmatter,
) {
  if (!frontmatter.parts) return;
  const blocks = Object.entries(frontmatter.parts)
    .map(([part, contents]) => {
      const data = { part };
      return contents.map((content) => {
        const root = parseMyst(session, content, file);
        return {
          type: 'block',
          data,
          visibility: 'remove',
          children: root.children,
        } as Block;
      });
    })
    .flat();
  mdast.children = [...blocks, ...mdast.children];
  delete frontmatter.parts;
}
