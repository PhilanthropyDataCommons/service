// In the case of non-ajv input validation, use this for input errors.
export class SimpleInputValidationError extends Error {
  public constructor(
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
