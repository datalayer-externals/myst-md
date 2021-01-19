"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mathPlugin = exports.addMathRenderers = exports.renderMath = void 0;
const markdown_it_texmath_1 = __importDefault(require("markdown-it-texmath"));
const utils_1 = require("./utils");
const renderMath = (math, block, target) => {
    const { id, number } = target !== null && target !== void 0 ? target : {};
    const [html] = utils_1.toHTML([block ? 'div' : 'span', {
            class: target ? ['math', 'numbered'] : 'math',
            id,
            number,
            children: block ? `\\[${math}\\]` : `\\(${math}\\)`,
        }], { inline: true });
    return block ? `${html}\n` : html;
};
exports.renderMath = renderMath;
function addMathRenderers(md) {
    const { renderer } = md;
    renderer.rules.math_inline = (tokens, idx) => exports.renderMath(tokens[idx].content, false);
    // Note: this will actually create invalid HTML
    renderer.rules.math_inline_double = (tokens, idx) => exports.renderMath(tokens[idx].content, true);
    renderer.rules.math_block = (tokens, idx) => exports.renderMath(tokens[idx].content, true);
    renderer.rules.math_block_end = () => '';
    renderer.rules.math_block_eqno = (tokens, idx) => {
        var _a;
        return (exports.renderMath(tokens[idx].content, true, (_a = tokens[idx].meta) === null || _a === void 0 ? void 0 : _a.target));
    };
    renderer.rules.math_block_eqno_end = () => '';
}
exports.addMathRenderers = addMathRenderers;
function mathPlugin(md) {
    md.use(markdown_it_texmath_1.default, {
        engine: { renderToString: (s) => s },
        delimiters: 'dollars',
    });
    // Note: numbering of equations for `math_block_eqno` happens in the directives rules
    addMathRenderers(md);
}
exports.mathPlugin = mathPlugin;
//# sourceMappingURL=math.js.map