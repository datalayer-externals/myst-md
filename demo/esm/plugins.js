export { default as frontMatterPlugin } from 'markdown-it-front-matter';
export { default as footnotePlugin } from 'markdown-it-footnote';
export { default as tasklistPlugin } from 'markdown-it-task-lists';
export { default as deflistPlugin } from 'markdown-it-deflist';
export { docutilsPlugin } from 'markdown-it-docutils';
export { mystBlockPlugin } from 'markdown-it-myst-extras';
export { plugin as mathPlugin } from './math';
/** Markdown-it plugin to convert the front-matter token to a renderable token, for previews */
export function convertFrontMatter(md) {
    md.core.ruler.after('block', 'convert_front_matter', (state) => {
        if (state.tokens.length && state.tokens[0].type === 'front_matter') {
            const replace = new state.Token('fence', 'code', 0);
            replace.map = state.tokens[0].map;
            replace.info = 'yaml';
            replace.content = state.tokens[0].meta;
            state.tokens[0] = replace;
        }
        return true;
    });
}
//# sourceMappingURL=plugins.js.map