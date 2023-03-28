// The following allows a defined key of nullable type.
// Thanks https://github.com/ajv-validator/ajv/issues/1375#issuecomment-1369252297
export const nullable = <T>(input: T): T => ({
  ...input,
  nullable: true,
});
