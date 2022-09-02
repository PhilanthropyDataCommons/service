import Ajv from 'ajv';
import ajvKeywords from 'ajv-keywords';

export const ajv = new Ajv({
  coerceTypes: true,
});
ajvKeywords(ajv, 'instanceof');
