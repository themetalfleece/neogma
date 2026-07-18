// Minimal Jest transformer that compiles ESM .mjs files to CommonJS so
// Jest's CJS runtime can load them. We need this for typebox v1 which
// ships only as pure ESM (.mjs).
const ts = require('typescript');

const transformer = {
  process(sourceText, sourcePath) {
    // Pretend the file is .ts so transpileModule actually emits CJS;
    // with a `.mjs` fileName, transpileModule treats it as plain JS and
    // does not transpile.
    const out = ts.transpileModule(sourceText, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
        sourceMap: false,
      },
      fileName: sourcePath + '.ts',
    });
    return { code: out.outputText };
  },
  getCacheKey(sourceText, sourcePath) {
    return require('crypto')
      .createHash('md5')
      .update(sourceText)
      .update(sourcePath)
      .digest('hex');
  },
};

module.exports = transformer;
