/**
 * The purpose of this marker class is to signal that the database query
 * succeeded but returned no data. In some situations such as a `PUT`, the
 * resulting HTTP status may need to be 500, whereas in other situations such as
 * a `PATCH`, HTTP 404 is more appropriate. The handler determines whether to
 * override the default 500.
 */
export class NoDataReturnedError extends Error {}
