import path from 'path';
import { TinyPg } from 'tinypg';
import { isQueryContextWithError } from '../types';
import type { TinyPgError } from 'tinypg';

export const db = new TinyPg({
  root_dir: [path.resolve(__dirname, 'queries')],
});

export const detectUniqueConstraintViolation = (error: TinyPgError): boolean => (
  isQueryContextWithError(error.queryContext)
  && error.queryContext.error.routine === '_bt_check_unique'
);
