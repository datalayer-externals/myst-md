import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import { liftMystDirectivesAndRolesTransform } from './liftMystDirectivesAndRoles.js';
import { mystTargetsTransform, headingLabelTransform } from './targets.js';
import { captionParagraphTransform } from './caption.js';
import { admonitionBlockquoteTransform, admonitionHeadersTransform } from './admonitions.js';
import { blockMetadataTransform, blockNestingTransform, blockToFigureTransform } from './blocks.js';
import { htmlIdsTransform } from './htmlIds.js';
import { imageAltTextTransform } from './images.js';
import { mathLabelTransform, mathNestingTransform, subequationTransform } from './math.js';
import { blockquoteTransform } from './blockquote.js';
import { codeBlockToDirectiveTransform } from './code.js';
import type { GenericParent } from 'myst-common';
import { removeUnicodeTransform } from './removeUnicode.js';

export function basicTransformations(tree: GenericParent, file: VFile, opts: Record<string, any>) {
  // lifting roles and directives must happen before the mystTarget transformation
  liftMystDirectivesAndRolesTransform(tree);
  // Some specifics about the ordering are noted below
  captionParagraphTransform(tree);
  codeBlockToDirectiveTransform(tree, file, { translate: ['math', 'mermaid'] });
  mathNestingTransform(tree, file);
  // Math labelling should happen before the target-transformation
  mathLabelTransform(tree, file);
  subequationTransform(tree, file);
  // Target transformation must happen after lifting the directives, and before the heading labels
  mystTargetsTransform(tree);
  // Label headings after the targets-transform
  headingLabelTransform(tree);
  admonitionBlockquoteTransform(tree); // Must be before header transforms
  admonitionHeadersTransform(tree);
  blockNestingTransform(tree);
  // Block metadata may contain labels/html_ids
  blockMetadataTransform(tree, file);
  blockToFigureTransform(tree, opts);
  htmlIdsTransform(tree);
  imageAltTextTransform(tree);
  blockquoteTransform(tree);
  removeUnicodeTransform(tree);
}

export const basicTransformationsPlugin: Plugin<
  [Record<string, any>],
  GenericParent,
  GenericParent
> = (opts) => (tree, file) => {
  basicTransformations(tree, file, opts);
};
