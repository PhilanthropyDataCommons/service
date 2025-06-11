import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import love from 'eslint-config-love';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

import sortExports from 'eslint-plugin-sort-exports';
import globals from 'globals';

export default defineConfig([
	js.configs.recommended,
	tseslint.configs.eslintRecommended,
	tseslint.configs.recommendedTypeChecked,
	tseslint.configs.strict,
	{
		...love,
		languageOptions: {
			parserOptions: {
				project: './tsconfig.dev.json',
			},
		},
	},
	prettier,
	{
		// These are new love rules that we weren't following.  Disabling them here lets
		// us re-enable them one-by-one alongside any necessary code changes.
		rules: {
			'@typescript-eslint/consistent-type-assertions': 'off',
			'@typescript-eslint/consistent-type-exports': 'off',
			'@typescript-eslint/consistent-type-imports': 'off',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/init-declarations': 'off',
			'@typescript-eslint/no-confusing-void-expression': 'off',
			'@typescript-eslint/no-deprecated': 'off',
			'@typescript-eslint/no-empty-function': 'off',
			'@typescript-eslint/no-import-type-side-effects': 'off',
			'@typescript-eslint/no-magic-numbers': 'off',
			'@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
			'@typescript-eslint/no-unnecessary-condition': 'off',
			'@typescript-eslint/no-unnecessary-template-expression': 'off',
			'@typescript-eslint/no-unnecessary-type-parameters': 'off',
			'@typescript-eslint/no-unsafe-type-assertion': 'off',
			'@typescript-eslint/non-nullable-type-assertion-style': 'off',
			'@typescript-eslint/prefer-destructuring': 'off',
			'@typescript-eslint/prefer-optional-chain': 'off',
			'@typescript-eslint/promise-function-async': 'off',
			'@typescript-eslint/return-await': 'off',
			'@typescript-eslint/strict-boolean-expressions': 'off',
			'@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
			'eslint-comments/require-description': 'off',
			'import/first': 'off',
			'max-lines': 'off',
			'max-nested-callbacks': 'off',
			'n/no-path-concat': 'off',
			'no-unreachable': 'off',
			'promise/avoid-new': 'off',
			complexity: 'off',
		},
	},
	{
		plugins: {
			'sort-exports': sortExports,
		},

		languageOptions: {
			globals: {
				...globals.node,
				...globals.jest,
			},

			ecmaVersion: 5,
			sourceType: 'commonjs',

			parserOptions: {
				project: './tsconfig.dev.json',
			},
		},

		rules: {
			'import/prefer-default-export': 'off',
			'import/no-default-export': 'error',
			'@typescript-eslint/prefer-readonly-parameter-types': 'off',

			'import/order': [
				'error',
				{
					groups: [
						'builtin',
						'external',
						'internal',
						'parent',
						'sibling',
						'index',
						'object',
						'type',
					],
					'newlines-between': 'never',
				},
			],

			'import/no-extraneous-dependencies': [
				'error',
				{
					devDependencies: [
						'src/test/*.{ts,js}',
						'src/**/__tests__/*.{ts,js}',
						'src/**/*.test.*.{ts,js}',
					],
				},
			],

			'@typescript-eslint/require-await': 'off',

			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					caughtErrors: 'none',
				},
			],
		},
		settings: {
			'import/resolver': {
				typescript: {
					alwaysTryTypes: true,
					project: './tsconfig.dev.json',
				},
				node: true,
			},
		},
	},
	{
		files: ['**/index.ts'],

		rules: {
			'sort-exports/sort-exports': [
				'error',
				{
					sortDir: 'asc',
					ignoreCase: true,
				},
			],
		},
	},
]);
