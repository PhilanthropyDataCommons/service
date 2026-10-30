// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Checking for empty array
const isEmpty = (array: unknown[]): boolean => array.length === 0;

// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Checking for empty array
const isNotEmpty = (array: unknown[]): boolean => array.length > 0;

export { isEmpty, isNotEmpty };
