import Ajv from 'ajv';
import ajvKeywords from 'ajv-keywords';

export const ajv = new Ajv();
ajvKeywords(ajv, 'instanceof');
