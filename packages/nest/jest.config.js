module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        diagnostics: { warnOnly: false },
      },
    ],
    // typebox ships ESM as .mjs, NestJS 12 ships ESM as .js. Both are compiled
    // to CommonJS so Jest's CJS runtime can load them.
    '^.+\\.m?js$': '<rootDir>/../../jest.transformer.mjs.js',
  },
  transformIgnorePatterns: [
    'node_modules[\\\\/](?!(?:.*[\\\\/])?(?:typebox|@nestjs[\\\\/][^\\\\/]+)[\\\\/])',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'mjs', 'js', 'json'],
};
