import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,
  prettier,
  {
    ignores: ['coverage/**', 'dist/**', 'node_modules/**', 'scripts/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      curly: 'error',
      'no-implicit-globals': 'error',
      'no-param-reassign': 'error',
    },
  },
  {
    files: [
      'tests/**/*.js',
      '**/*.test.js',
      'vitest.config.js',
      'vite.config.js',
      'eslint.config.js',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        vi: 'readonly',
      },
    },
  },
];
