import fs from 'node:fs';
import path from 'node:path';
import type { Content } from 'mdast';
import { createDocFromState, DocxSerializer, writeDocx } from 'myst-to-docx';
import { tic, writeFileToFolder } from 'myst-cli-utils';
import { ExportFormats } from 'myst-frontmatter';
import type { RendererDoc } from 'myst-templates';
import MystTemplate from 'myst-templates';
import type { LinkTransformer } from 'myst-transforms';
import { htmlTransform } from 'myst-transforms';
import { fileError, fileWarn, RuleId, TemplateKind } from 'myst-common';
import { selectAll } from 'unist-util-select';
import { VFile } from 'vfile';
import { findCurrentProjectAndLoad } from '../../config.js';
import { finalizeMdast } from '../../process/mdast.js';
import { loadProjectFromDisk } from '../../project/load.js';
import type { ISession } from '../../session/types.js';
import type { RendererData } from '../../transforms/types.js';
import { createTempFolder } from '../../utils/createTempFolder.js';
import { logMessagesFromVFile } from '../../utils/logMessagesFromVFile.js';
import { ImageExtensions } from '../../utils/resolveExtension.js';
import type { ExportOptions, ExportResults, ExportWithOutput } from '../types.js';
import { cleanOutput } from '../utils/cleanOutput.js';
import { collectWordExportOptions } from '../utils/collectExportOptions.js';
import { getFileContent } from '../utils/getFileContent.js';
import { resolveAndLogErrors } from '../utils/resolveAndLogErrors.js';
import { createFooter } from './footers.js';
import { createArticleTitle, createReferenceTitle } from './titles.js';

const DOCX_IMAGE_EXTENSIONS = [ImageExtensions.png, ImageExtensions.jpg, ImageExtensions.jpeg];

function defaultWordRenderer(
  session: ISession,
  data: RendererData,
  doc: RendererDoc,
  opts: Record<string, any>,
  staticPath: string,
  vfile: VFile,
) {
  const { mdast, frontmatter, references } = data;
  const frontmatterNodes = createArticleTitle(frontmatter.title, frontmatter.authors) as Content[];
  const serializer = new DocxSerializer(
    vfile,
    {
      getImageBuffer(image: string) {
        // This extra read somehow prevents an error when buffer-image-size tries to get image dimensions...
        fs.readFileSync(image);
        return Buffer.from(fs.readFileSync(image).buffer);
      },
      useFieldsForCrossReferences: false,
    },
    frontmatter,
  );
  frontmatterNodes.forEach((node) => {
    serializer.render(node);
  });
  serializer.renderChildren(mdast);
  const referencesDocStates = Object.values(references.cite?.data ?? {})
    .map(({ html }) => html)
    .sort((a, b) => a.localeCompare(b))
    .map((html) => {
      return { type: 'html', value: html };
    });
  if (referencesDocStates.length > 0) {
    serializer.render(createReferenceTitle());
    const referencesRoot = htmlTransform({ type: 'root', children: referencesDocStates as any });
    serializer.renderChildren(referencesRoot);
  }
  selectAll('footnoteDefinition', mdast).forEach((footnote) => {
    serializer.render(footnote);
  });
  const logo = path.join(staticPath, 'logo.png');
  const docfooter = fs.existsSync(logo) && !opts.hideFooter ? createFooter(logo) : undefined;
  const styles = path.join(staticPath, 'styles.xml');
  const docstyles = fs.existsSync(styles) ? fs.readFileSync(styles).toString() : undefined;
  return createDocFromState(serializer, docfooter, docstyles);
}

export async function runWordExport(
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  projectPath?: string,
  clean?: boolean,
  extraLinkTransformers?: LinkTransformer[],
): Promise<ExportResults> {
  const { output, article } = exportOptions;
  if (clean) cleanOutput(session, output);
  const vfile = new VFile();
  vfile.path = output;
  const imageWriteFolder = createTempFolder(session);
  const [data] = await getFileContent(session, [article], {
    projectPath,
    imageExtensions: DOCX_IMAGE_EXTENSIONS,
    extraLinkTransformers,
  });
  const mystTemplate = new MystTemplate(session, {
    kind: TemplateKind.docx,
    template: exportOptions.template || undefined,
    buildDir: session.buildPath(),
    errorLogFn: (message: string) => {
      fileError(vfile, message, { ruleId: RuleId.docxRenders });
    },
    warningLogFn: (message: string) => {
      fileWarn(vfile, message, { ruleId: RuleId.docxRenders });
    },
  });
  await mystTemplate.ensureTemplateExistsOnPath();
  const toc = tic();
  const { options, doc } = mystTemplate.prepare({
    frontmatter: data.frontmatter,
    parts: [],
    options: { ...data.frontmatter.options, ...exportOptions },
    sourceFile: file,
  });
  const renderer = exportOptions.renderer ?? defaultWordRenderer;
  await finalizeMdast(session, data.mdast, data.frontmatter, article, {
    imageWriteFolder,
    imageExtensions: DOCX_IMAGE_EXTENSIONS,
    simplifyFigures: true,
  });
  const docx = renderer(session, data, doc, options, mystTemplate.templatePath, vfile);
  logMessagesFromVFile(session, vfile);
  await writeDocx(docx, (buffer) => writeFileToFolder(output, buffer));
  session.log.info(toc(`📄 Exported DOCX in %s, copying to ${output}`));
  return { tempFolders: [imageWriteFolder] };
}

export async function localArticleToWord(
  session: ISession,
  file: string,
  opts: ExportOptions,
  templateOptions?: Record<string, any>,
  extraLinkTransformers?: LinkTransformer[],
): Promise<ExportResults> {
  let { projectPath } = opts;
  if (!projectPath) projectPath = findCurrentProjectAndLoad(session, path.dirname(file));
  if (projectPath) await loadProjectFromDisk(session, projectPath);
  const exportOptionsList = (
    await collectWordExportOptions(session, file, 'docx', [ExportFormats.docx], projectPath, opts)
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  const results: ExportResults = { tempFolders: [] };
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      const exportResult = await runWordExport(
        session,
        file,
        exportOptions,
        projectPath,
        opts.clean,
        extraLinkTransformers,
      );
      results.tempFolders.push(...exportResult.tempFolders);
    }),
    opts.throwOnFailure,
  );
  return results;
}
