/* istanbul ignore file */
// Jest expects a single default function to be exported from this file.
/* eslint-disable import/no-default-export */
import type { Config } from 'jest';

export default (globalConfig: Config, projectConfig: Config): void => {
	if (
		(process.env.LOG_LEVEL === undefined || process.env.LOG_LEVEL === '') &&
		(globalConfig.silent === true || projectConfig.silent === true)
	) {
		process.env.LOG_LEVEL = 'silent';
	}
};
