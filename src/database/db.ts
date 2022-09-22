import path from 'path';
import { TinyPg } from 'tinypg';
import { isQueryContextWithError } from '../types';
import type { TinyPgError } from 'tinypg';

// See https://www.postgresql.org/docs/8.2/errcodes-appendix.html
export enum PostgresErrorCode {
  FOREIGN_KEY_VIOLATION = '23503',
  UNIQUE_VIOLATION = '23505',
}

export const db = new TinyPg({
  root_dir: [path.resolve(__dirname, 'queries')],
});

export const detectUniqueConstraintViolation = (error: TinyPgError): boolean => (
  isQueryContextWithError(error.queryContext)
  && error.queryContext.error.code === PostgresErrorCode.UNIQUE_VIOLATION
);
