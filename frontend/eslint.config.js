import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    // TS/TSX incluidos y reglas de estilo alineadas con backend/ (reglas §18)
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variableLike',
          // PascalCase: componentes React declarados como const
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          // elementos sin usarse se marcan con guion bajo
          leadingUnderscore: 'allow',
        },
        { selector: 'typeLike', format: ['PascalCase'] },
        // en React los componentes van en PascalCase (reglas §18)
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // hooks conviven con su provider en el mismo archivo
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ['useAuth'] },
      ],
      // El patrón canónico de datos (fetch en el mount → setState tras la
      // promesa) dispara esta regla del plugin de React Hooks
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
