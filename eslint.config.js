import eslint from '@eslint/js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';

// prettier stuff
import neostandard from 'neostandard';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default [
  eslint.configs.recommended,
  includeIgnoreFile(gitignorePath),
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        Buffer: true,
        console: true,
        process: true
      }
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      ...neostandard.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error'
    }
  }
];
