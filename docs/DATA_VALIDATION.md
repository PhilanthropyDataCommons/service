# Base field datatype validation

PDC fields are validated on the basis of `baseField.dataType` (separate from `inputType`, see more [here](./APPLICATION_RENDERING_HINTS.md)). This document provides more detail on how different data types are validated within PDC.

## Approach

PDC does not modify, normalize, trim, or otherwise change any of the data that it receives, stores, and retrieves. Instead, data validation provides users with the expectation of well-formatted data only for field values accompanied by `isValid: true`.

This means all values with leading or trailing whitespace will be considered invalid.

Where possible, we have used existing libraries for data validation.

- [ajv](https://github.com/ajv-validator/ajv)
- [validator](https://github.com/validatorjs/validator.js)

## Data types

| Data type        | Validator   | Notes                                                               |
| ---------------- | ----------- | ------------------------------------------------------------------- |
| `boolean`        |             |                                                                     |
| `number`         |             |                                                                     |
| `string`         | ajv         |                                                                     |
| `email`          | ajv         |                                                                     |
| `url`            | ajv         |                                                                     |
| `date`           | ajv         | Full date per [RFC3339][1]                                          |
| `date_time`      | ajv         | Must include timezone                                               |
| `currency`       | validator   |                                                                     |
| `phone_number`   | validator   | Extensions must be preceded by `;ext=` per [RFC3966][2] or commas   |
| `file`           |             | [Read more](./ADD_FIELDVALUE_ATTACHMENT.md)                         |
| ---------------- | ----------- | ------------------------------------------------------------------- |

[1]: http://tools.ietf.org/html/rfc3339#section-5.6
[2]: https://www.rfc-editor.org/rfc/rfc3966#section-3
