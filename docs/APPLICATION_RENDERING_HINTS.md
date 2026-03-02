# Application Form Field Rendering Hints (Input Types)

The `inputType` field on an `ApplicationFormField` serves as a rendering hint
for UIs that display application forms. It allows form designers to specify
how a field should be presented to the user, independently of the field's
underlying data type.

## Overview

Each `ApplicationFormField` has two related but distinct attributes that
together describe how a field should be handled:

- **`baseField.dataType`** — describes the _semantic type_ of the data being
  collected (e.g., `string`, `number`, `email`, `url`). The PDC service uses
  this for data validation.
- **`inputType`** — describes the _preferred UI control_ for collecting that
  data. This is purely a rendering hint; the service does not enforce
  constraints based on `inputType`.

When `inputType` is `null`, the UI should fall back to a sensible default
rendering based on `baseField.dataType`, that enforces the data type
at the user experience level.

## Input Type Values

These are the currently supported inputType values in the
service.

| Value         | Description                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| `shortText`   | A single-line text input. Suitable for brief, unformatted responses.                                  |
| `longText`    | A multi-line textarea. Suitable for narrative or free-form responses.                                 |
| `radio`       | A set of mutually exclusive options displayed as radio buttons.                                       |
| `dropdown`    | A set of mutually exclusive options displayed in a dropdown (select) menu.                            |
| `multiselect` | A control that allows one or more options to be selected simultaneously.                              |
| `hidden`      | The field is not displayed to the applicant. Useful for tracking metadata or system-populated values. |

## Relationship to `baseField.dataType`

The `inputType` and `dataType` are independent of each other in the API, but
UIs should use them together to render fields sensibly. For example, a field
with `dataType: "string"` could reasonably be rendered as `shortText`,
`longText`, `radio`, `dropdown`, or `multiselect` depending on the intended
use. A field with `dataType: "boolean"` might be rendered as `radio` buttons
offering "Yes" / "No" options.

The service does not validate that a given `inputType` is appropriate for a
given `dataType`; that responsibility lies with form designers and the
consuming UI.

## Null `inputType`

An `inputType` of `null` means no rendering hint has been specified. UIs
encountering a `null` `inputType` should apply their own default rendering
logic based on `baseField.dataType`. For instance:

- `string` → single-line text input
- `number` or `currency` → numeric input
- `boolean` → checkbox or radio buttons
- `email` → email input
- `url` → URL input
- `phone_number` → telephone input
- `file` → file upload control

## API Usage

The `inputType` field is returned in `ApplicationFormField` responses. It can
be set at creation time or updated later via patch.

### Setting `inputType` when creating an application form

`ApplicationFormField` records are created as part of `POST /applicationForms`.
Include `inputType` in each entry of the `fields` array:

```json
{
	"opportunityId": 3203,
	"name": "2025 Grant Application",
	"fields": [
		{
			"baseFieldShortCode": "project_description",
			"position": 2,
			"label": "Describe your project",
			"instructions": "Please provide a detailed description of your proposed project.",
			"inputType": "longText"
		}
	]
}
```

### Patching `inputType` on an existing application form field

Use `PATCH /applicationFormFields/{applicationFormFieldId}` to update `label`,
`instructions`, and/or `inputType` on an existing field:

```json
{
	"inputType": "radio"
}
```

To clear a previously set `inputType` and revert to default rendering, patch
the field with `"inputType": null`.

### Example `ApplicationFormField` response

```json
{
	"id": 42,
	"applicationFormId": 7,
	"baseFieldShortCode": "project_description",
	"position": 2,
	"label": "Describe your project",
	"instructions": "Please provide a detailed description of your proposed project.",
	"inputType": "longText",
	"createdAt": "2026-01-15T12:00:00Z",
	"baseField": {
		"shortCode": "project_description",
		"label": "Project Description",
		"description": "A description of the project for which funding is sought.",
		"dataType": "string",
		"category": "project",
		"valueRelevanceHours": null,
		"sensitivityClassification": "public",
		"localizations": {},
		"createdAt": "2025-06-01T00:00:00Z"
	}
}
```

The OpenAPI schema for the enumerated values is defined in
`src/openapi/components/schemas/ApplicationFormFieldInputType.json`.
