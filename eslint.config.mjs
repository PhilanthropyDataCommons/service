import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';

import sortExports from 'eslint-plugin-sort-exports';
import globals from 'globals';

export default defineConfig([
	{
		files: ['**/*.ts'],
	},
	js.configs.recommended,
	tseslint.configs.eslintRecommended,
	tseslint.configs.recommendedTypeChecked,
	tseslint.configs.strict,
	importPlugin.flatConfigs.recommended,
	prettier,
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
