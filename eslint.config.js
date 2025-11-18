import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-undef': 'error',
    },
  },
  {
    files: ['test/**/*.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        ...globals.mocha,
      },
    },
  },
  {
    ignores: ['node_modules/**', 'coverage/**', '.git/**', 'dist/**', 'build/**'],
  },
];

