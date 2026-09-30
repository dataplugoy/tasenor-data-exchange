import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'
import { defineConfig } from 'eslint/config'

// Standard style without semicolons, as before the move to the flat config.
export default defineConfig(
  js.configs.recommended,
  tseslint.configs.recommended,
  stylistic.configs.customize({ indent: 2, quotes: 'single', semi: false, commaDangle: 'only-multiline', braceStyle: '1tbs' }),
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: 'always' }],
      '@stylistic/padded-blocks': 'off',
      '@stylistic/arrow-parens': 'off',
      '@stylistic/quote-props': 'off',
      '@stylistic/space-before-function-paren': 'off',
      '@stylistic/operator-linebreak': 'off',
      '@stylistic/max-statements-per-line': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true, vars: 'all' }],
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true, allowTaggedTemplates: true }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
    },
  },
)
