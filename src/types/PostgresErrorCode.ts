// See https://www.postgresql.org/docs/8.2/errcodes-appendix.html
export enum PostgresErrorCode {
	FOREIGN_KEY_VIOLATION = '23503',
	UNIQUE_VIOLATION = '23505',
	NUMBER_OUT_OF_RANGE = '22003',
	CHECK_CONSTRAINT_VIOLATION = '23514',
	INSUFFICIENT_RESOURCES = '53000',
}
