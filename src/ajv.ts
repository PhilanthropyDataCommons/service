import Ajv from 'ajv';
import ajvKeywords from 'ajv-keywords';
import addFormats from 'ajv-formats';
import * as tags from 'language-tags';
import type { ValidateFunction } from 'ajv';

interface TypeGuardWithAjvErrors<T> extends Pick<
	ValidateFunction<T>,
	'errors'
> {
	(data: unknown): data is T;
}

const ajv = new Ajv();

ajv.addKeyword({
	keyword: 'isValidLanguageTag',
	schema: false,
	validate: (data: string) => tags.check(data),
	errors: false,
});

ajvKeywords(ajv, 'instanceof');
addFormats(ajv, ['email', 'uri', 'uuid']);

export { ajv, type TypeGuardWithAjvErrors };
