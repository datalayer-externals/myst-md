import type { RoleSpec } from 'myst-common';
import { fileWarn, normalizeLabel, ParseTypesEnum } from 'myst-common';

const REF_PATTERN = /^(.+?)<([^<>]+)>$/; // e.g. 'Labeled Term <term>'

export const termRole: RoleSpec = {
  name: 'term',
  body: {
    type: ParseTypesEnum.string,
    required: true,
  },
  run(data, vfile) {
    const body = data.body as string;
    const match = REF_PATTERN.exec(body);
    const [, modified, rawLabel] = match ?? [];
    const { label, identifier } = normalizeLabel(rawLabel ?? body) ?? {};
    if (!identifier) {
      fileWarn(vfile, `Unknown {term} role with body: "${body}"`, { source: 'role:term' });
    }
    return [
      {
        type: 'crossReference',
        label,
        identifier: `term-${identifier}`,
        children: modified ? [{ type: 'text', value: modified.trim() }] : undefined,
      },
    ];
  },
};
