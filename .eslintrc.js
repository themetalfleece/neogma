module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['prettier', '@typescript-eslint'],
    parserOptions: {
        project: './tsconfig.json',
    },
    extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier/@typescript-eslint',
        'plugin:prettier/recommended',
    ],
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    rules: {
        '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
        '@typescript-eslint/no-explicit-any': ['off'],
        semi: ['error', 'always'],
    },
};
