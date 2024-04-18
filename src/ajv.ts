import Ajv from 'ajv';
import ajvKeywords from 'ajv-keywords';
import addFormats from 'ajv-formats';

export const ajv = new Ajv({
	coerceTypes: true,
});

ajvKeywords(ajv, 'instanceof');
addFormats(ajv, ['email', 'uri']);
