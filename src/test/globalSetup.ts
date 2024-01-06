// Jest expects a single default function to be exported from this file.
/* eslint-disable import/no-default-export */
import dotenv from 'dotenv';
import type { Config } from 'jest';

// TODO: reconsider use of '.env.test' if or when
// https://github.com/ThomWright/postgres-migrations/pull/93 gets merged/fixed.
dotenv.config({ path: '.env.test' });

// Production code will run dotenv.config() anyway, so make clear that it
// happens by running the same explicitly here. If '.env.test' has any variables
// set, they will override the later/inner set variables such as those in the
// '.env' file. There might be a better way to manage 'dotenv' and pino logger
// setup.
dotenv.config();

export default (globalConfig: Config, projectConfig: Config): void => {
	if (
		(process.env.LOG_LEVEL === undefined || process.env.LOG_LEVEL === '') &&
		(globalConfig.silent === true || projectConfig.silent === true)
	) {
		process.env.LOG_LEVEL = 'silent';
	}
};
