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
			'@typescript-eslint/no-magic-numbers': [
				'error',
				{
					detectObjects: false,
					ignoreEnums: true,
				},
			],
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
			// Indexes shouldn't care about the nature of the exports they are collating
			'@typescript-eslint/consistent-type-exports': 'off',
		},
	},
	{
		files: ['**/*test.ts'],

		rules: {
			// Forcing return type definitions in our ad-hoc test functions is not worth
			// the added effort / verbosity.
			'@typescript-eslint/explicit-function-return-type': 'off',

			// Tests use hard coded numbers in lots of places, and that's OK for now.
			'@typescript-eslint/no-magic-numbers': 'off',
		},
	},
]);
