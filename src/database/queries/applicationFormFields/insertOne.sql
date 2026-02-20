INSERT INTO application_form_fields (
	application_form_id,
	base_field_short_code,
	position,
	label,
	instructions,
	input_type
) VALUES (
	:applicationFormId,
	:baseFieldShortCode,
	:position,
	:label,
	:instructions,
	:inputType
)
RETURNING application_form_field_to_json(application_form_fields) AS object;
