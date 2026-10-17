// Minimal Jest transformer that compiles ESM files to CommonJS so Jest's
// CJS runtime can load them. We need this for packages that ship only as
// pure ESM: typebox v1 (.mjs) and NestJS 12 (.js with "type": "module").
const ts = require('typescript');

// `import.meta` is a syntax error in CommonJS, and transpileModule leaves it
// untouched, so swap the only form these packages use for its CJS equivalent.
const IMPORT_META_URL = /\bimport\.meta\.url\b/g;
const CJS_FILE_URL = "require('url').pathToFileURL(__filename).href";

const transformer = {
  process(sourceText, sourcePath) {
    // Pretend the file is .ts so transpileModule actually emits CJS;
    // with a `.mjs` fileName, transpileModule treats it as plain JS and
    // does not transpile.
    const out = ts.transpileModule(
      sourceText.replace(IMPORT_META_URL, CJS_FILE_URL),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          esModuleInterop: true,
          sourceMap: false,
        },
        fileName: sourcePath + '.ts',
      },
    );
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
