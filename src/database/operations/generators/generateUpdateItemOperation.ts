import { generateCreateItemOperation } from './generateCreateItemOperation';

/**
 * This really is just an alias of create, since the API itself is identical.
 * It exists to avoid unintuitive situations in our code base such as:
 * `updateFoo = generateCreateItemOperation(...)`
 */
const generateUpdateItemOperation = generateCreateItemOperation;

export { generateUpdateItemOperation };
