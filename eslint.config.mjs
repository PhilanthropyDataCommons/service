import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import love from 'eslint-config-love';
import pino from 'eslint-plugin-pino';
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
	{
		plugins: {
			pino: pino,
		},
		rules: {
			'pino/correct-args-position': 'error',
		},
	},
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

			// Unlike some code bases we explicitly do not want to use default exports.
			'import/prefer-default-export': 'off',
			'import/no-default-export': 'error',

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

			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					caughtErrors: 'none',
				},
			],

			// These are temporarily disabled so we can turn them on alongside necessary code changes
			'require-unicode-regexp': 'off',
			'require-atomic-updates': 'off',
			'@typescript-eslint/strict-void-return': 'off',
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

			// Jest hoists mock statements, so sometimes we need to define mock functions
			// that are used in mocks BEFORE the import block.  There may be a better
			// approach to this, but for now it is how we do it and so the rule must go.
			'import/first': 'off',

			// The way we organize tests our test files can be very long since we're comprehensive.
			// We could refactor, potentially, but even then I imagine that a line limit is not
			// going to be useful in this context.
			'max-lines': 'off',

			// Tests are already 2-3 levels deep in nested callbacks, so we update this rule to 5 instead of 3.
			'max-nested-callbacks': ['error', 5],
		},
	},
	{
		files: ['**/middleware/*.ts'],

		rules: {
			// Express middleware is designed to mutate the request object by adding properties.
			// This is the standard, expected pattern for middleware that decorates req with
			// context like user authentication, roles, etc.
			'no-param-reassign': ['error', { props: false }],
		},
	},
]);
