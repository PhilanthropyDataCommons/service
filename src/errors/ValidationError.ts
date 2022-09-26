// This error was donated by the TV Kitchen project / Bad Idea Factory
// https://github.com/tvkitchen/countertop/blob/main/src/errors/ValidationError.ts
import type { ErrorObject } from 'ajv';

export class ValidationError extends Error {
  public errors: ErrorObject[];

  public constructor(
    message: string,
    errors: ErrorObject[],
  ) {
    super(message);
    this.name = this.constructor.name;
    this.errors = errors;
  }
}
