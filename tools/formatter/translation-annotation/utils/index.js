const { root } = require('mdast-builder');
const unified = require('unified');
const { inlineCode } = require('mdast-util-to-markdown/lib/handle');
const remarkParse = require('remark-parse');
const remarkStringify = require('remark-stringify');
const tableAndStrikethrough = require('../../../challenge-md-parser/mdx/plugins/table-and-strikethrough');

const notranslateStart = '<notranslate>';
const notranslateEnd = '</notranslate>';

const wrapInlineCode = (...args) =>
  notranslateStart + inlineCode(...args) + notranslateEnd;

const baseProcessor = () =>
  unified()
    .use(remarkParse)
    .use(tableAndStrikethrough);

const annotateCode = md =>
  baseProcessor()
    .use(remarkStringify, {
      fences: true,
      emphasis: '*',
      handlers: { inlineCode: wrapInlineCode }
    })
    .processSync(md).contents;

const stringifyMd = nodes =>
  baseProcessor()
    .use(remarkStringify, { fences: true, emphasis: '*' })
    .stringify(root(nodes));

module.exports.stringifyMd = stringifyMd;
module.exports.annotateCode = annotateCode;
module.exports.baseProcessor = baseProcessor;
module.exports.notranslateStart = notranslateStart;
module.exports.notranslateEnd = notranslateEnd;
