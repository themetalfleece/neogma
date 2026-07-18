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
    '^.+\\.mjs$': '<rootDir>/../../jest.transformer.mjs.js',
  },
  transformIgnorePatterns: [
    'node_modules[\\\\/](?!(?:.*[\\\\/])?typebox[\\\\/])',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'mjs', 'js', 'json'],
};
