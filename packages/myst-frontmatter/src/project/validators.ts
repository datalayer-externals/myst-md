import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  filterKeys,
  incrementOptions,
  validateBoolean,
  validateChoice,
  validateDate,
  validateList,
  validateObject,
  validateObjectKeys,
  validateString,
  validateUrl,
} from 'simple-validators';
import { validateBiblio } from '../biblio/validators.js';
import { validateExportsList } from '../exports/validators.js';
import { validateLicenses } from '../licenses/validators.js';
import { validateNumbering } from '../numbering/validators.js';
import {
  FRONTMATTER_ALIASES,
  SITE_FRONTMATTER_KEYS,
  validateSiteFrontmatterKeys,
} from '../site/validators.js';
import { validateThebe } from '../thebe/validators.js';
import { validateBooleanOrObject, validateDoi } from '../utils/validators.js';
import type { ProjectAndPageFrontmatter, ProjectFrontmatter, ProjectSettings } from './types.js';

const OUTPUT_REMOVAL_OPTIONS: Required<ProjectSettings>['output_stderr'][] = [
  'show',
  'remove',
  'remove-warn',
  'remove-error',
  'warn',
  'error',
];
export const PROJECT_SETTINGS = ['output_stderr', 'output_stdout', 'output_matplotlib_strings'];
export const PROJECT_SETTINGS_ALIAS = {
  stderr_output: 'output_stderr',
  stdout_output: 'output_stdout',
};

export const PROJECT_AND_PAGE_FRONTMATTER_KEYS = [
  'date',
  'name',
  'doi',
  'arxiv',
  'open_access',
  'license',
  'binder',
  'source',
  'subject',
  'biblio',
  'oxa',
  'numbering',
  'bibliography',
  'math',
  'abbreviations',
  'exports',
  'settings', // We maybe want to move this into site frontmatter in the future
  // Do not add any project specific keys here!
  ...SITE_FRONTMATTER_KEYS,
];

export const PROJECT_FRONTMATTER_KEYS = [
  ...PROJECT_AND_PAGE_FRONTMATTER_KEYS,
  // These keys only exist on the project
  'references',
  'requirements',
  'resources',
  'thebe',
];

export function validateProjectAndPageSettings(
  value: Record<string, any>,
  opts: ValidationOptions,
): ProjectSettings | undefined {
  const output: ProjectSettings = {};
  const settings = validateObjectKeys(
    value,
    { optional: PROJECT_SETTINGS, alias: PROJECT_SETTINGS_ALIAS },
    opts,
  );
  if (!settings) return undefined;
  if (defined(settings.output_stderr)) {
    const output_stderr = validateChoice(settings.output_stderr, {
      ...incrementOptions('output_stderr', opts),
      choices: OUTPUT_REMOVAL_OPTIONS,
    });
    if (output_stderr) output.output_stderr = output_stderr;
  }
  if (defined(settings.output_stdout)) {
    const output_stdout = validateChoice(settings.output_stdout, {
      ...incrementOptions('output_stdout', opts),
      choices: OUTPUT_REMOVAL_OPTIONS,
    });
    if (output_stdout) output.output_stdout = output_stdout;
  }
  if (defined(settings.output_matplotlib_strings)) {
    const output_matplotlib_strings = validateChoice(settings.output_matplotlib_strings, {
      ...incrementOptions('output_matplotlib_strings', opts),
      choices: OUTPUT_REMOVAL_OPTIONS,
    });
    if (output_matplotlib_strings) output.output_matplotlib_strings = output_matplotlib_strings;
  }
  if (Object.keys(output).length === 0) return undefined;
  return output;
}

export function validateProjectAndPageFrontmatterKeys(
  value: Record<string, any>,
  opts: ValidationOptions,
) {
  const output: ProjectAndPageFrontmatter = validateSiteFrontmatterKeys(value, opts);
  if (defined(value.date)) {
    output.date = validateDate(value.date, incrementOptions('date', opts));
  }
  if (defined(value.name)) {
    output.name = validateString(value.name, incrementOptions('name', opts));
  }
  if (defined(value.doi)) {
    output.doi = validateDoi(value.doi, incrementOptions('doi', opts));
  }
  if (defined(value.arxiv)) {
    output.arxiv = validateUrl(value.arxiv, {
      ...incrementOptions('arxiv', opts),
      includes: 'arxiv.org',
    });
  }
  if (defined(value.open_access)) {
    output.open_access = validateBoolean(value.open_access, incrementOptions('open_access', opts));
  }
  if (defined(value.license)) {
    output.license = validateLicenses(value.license, incrementOptions('license', opts));
  }
  if (defined(value.binder)) {
    output.binder = validateUrl(value.binder, incrementOptions('binder', opts));
  }
  if (defined(value.source)) {
    output.source = validateUrl(value.source, incrementOptions('source', opts));
  }
  if (defined(value.subject)) {
    output.subject = validateString(value.subject, {
      ...incrementOptions('subject', opts),
      maxLength: 40,
    });
  }
  if (defined(value.bibliography)) {
    output.bibliography = validateList(
      value.bibliography,
      { coerce: true, ...incrementOptions('bibliography', opts) },
      (req, index) => {
        return validateString(req, incrementOptions(`bibliography.${index}`, opts));
      },
    );
  }
  if (defined(value.biblio)) {
    output.biblio = validateBiblio(value.biblio, incrementOptions('biblio', opts));
  }
  if (defined(value.oxa)) {
    // TODO: better oxa validation
    output.oxa = validateString(value.oxa, incrementOptions('oxa', opts));
  }
  if (defined(value.numbering)) {
    output.numbering = validateBooleanOrObject(
      value.numbering,
      incrementOptions('numbering', opts),
      validateNumbering,
    );
  }
  if (defined(value.math)) {
    const mathOpts = incrementOptions('math', opts);
    const math = validateObject(value.math, mathOpts);
    if (math) {
      const stringKeys = Object.keys(math).filter((key) => {
        // Filter on non-string values
        return validateString(math[key], incrementOptions(key, mathOpts));
      });
      output.math = filterKeys(math, stringKeys);
    }
  }
  if (defined(value.abbreviations)) {
    const abbreviationsOpts = incrementOptions('abbreviations', opts);
    const abbreviations = validateObject(value.abbreviations, abbreviationsOpts);
    if (abbreviations) {
      const stringKeys = Object.keys(abbreviations).filter((key) => {
        // Filter on non-string values
        return validateString(abbreviations[key], incrementOptions(key, abbreviationsOpts));
      });
      output.abbreviations = filterKeys(abbreviations, stringKeys);
    }
  }
  if (defined(value.exports)) {
    const exports = validateExportsList(value.exports, opts);
    if (exports) output.exports = exports;
  }
  if (value.thumbnail === null) {
    // It is possible for the thumbnail to explicitly be null.
    // This means not to look to the images in a page.
    output.thumbnail = null;
  } else if (defined(value.thumbnail)) {
    output.thumbnail = validateString(value.thumbnail, incrementOptions('thumbnail', opts));
  }
  if (defined(value.thumbnailOptimized)) {
    // No validation, this is expected to be set programmatically
    output.thumbnailOptimized = value.thumbnailOptimized;
  }
  if (value.banner === null) {
    // It is possible for the banner to explicitly be null.
    // This means not to look to the images in a page.
    output.banner = null;
  } else if (defined(value.banner)) {
    output.banner = validateString(value.banner, incrementOptions('banner', opts));
  }
  if (defined(value.bannerOptimized)) {
    // No validation, this is expected to be set programmatically
    output.bannerOptimized = value.bannerOptimized;
  }
  if (defined(value.settings)) {
    const settings = validateProjectAndPageSettings(
      value.settings,
      incrementOptions('settings', opts),
    );
    if (settings) output.settings = settings;
  }
  return output;
}

export function validateProjectFrontmatterKeys(
  value: Record<string, any>,
  opts: ValidationOptions,
) {
  const output: ProjectFrontmatter = validateProjectAndPageFrontmatterKeys(value, opts);
  // This is only for the project, and is not defined on pages
  if (defined(value.references)) {
    const referencesOpts = incrementOptions('references', opts);
    const references = validateObject(value.references, referencesOpts);
    if (references) {
      output.references = Object.fromEntries(
        Object.keys(references)
          .map((key) => {
            const url = validateUrl(references[key], incrementOptions(key, referencesOpts));
            if (!url) return undefined;
            return [key, { url }];
          })
          .filter((exists) => !!exists) as [string, { url: string }][],
      );
    }
  }

  if (defined(value.thebe)) {
    const result = validateThebe(value.thebe, incrementOptions('thebe', opts));
    if (result && Object.values(result).filter((val) => val !== undefined).length > 0) {
      output.thebe = result;
    } else {
      delete output.thebe;
    }
  }

  if (defined(value.requirements)) {
    output.requirements = validateList(
      value.requirements,
      incrementOptions('requirements', opts),
      (req, index) => {
        return validateString(req, incrementOptions(`requirements.${index}`, opts));
      },
    );
  }
  if (defined(value.resources)) {
    output.resources = validateList(
      value.resources,
      incrementOptions('resources', opts),
      (res, index) => {
        return validateString(res, incrementOptions(`resources.${index}`, opts));
      },
    );
  }
  return output;
}

/**
 * Validate ProjectFrontmatter object against the schema
 */
export function validateProjectFrontmatter(input: any, opts: ValidationOptions) {
  const value =
    validateObjectKeys(
      input,
      { optional: PROJECT_FRONTMATTER_KEYS, alias: FRONTMATTER_ALIASES },
      opts,
    ) || {};
  return validateProjectFrontmatterKeys(value, opts);
}
