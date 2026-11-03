// Configuration ESLint unique pour tout le projet (format « flat config », ESLint 9)
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', 'docs/**', '**/logs/**'] },

  js.configs.recommended,

  // Backend, gateway et microservices : Node.js (CommonJS)
  {
    files: ['backend/**/*.js', 'gateway/**/*.js', 'microservices/**/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_|^next$|^req$', caughtErrors: 'none' }],
      'no-console': 'off',
      eqeqeq: 'error',
      'prefer-const': 'error',
    },
  },

  // Frontend React
  {
    files: ['frontend/src/**/*.{js,jsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: {
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      eqeqeq: 'error',
      'prefer-const': 'error',
    },
  },

  // Fichiers de configuration de l'outillage
  { files: ['**/*.config.{js,mjs}', 'frontend/*.config.js'], languageOptions: { globals: globals.node } },

  // Désactive les règles de style qui entreraient en conflit avec Prettier (Prettier gère la mise en forme)
  prettier,
];
