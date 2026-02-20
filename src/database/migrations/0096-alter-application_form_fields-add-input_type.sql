CREATE TYPE application_form_field_input_type_t AS ENUM (
	'shortText',
	'longText',
	'radio',
	'dropdown',
	'multiselect',
	'hidden'
);

ALTER TABLE application_form_fields
ADD COLUMN input_type application_form_field_input_type_t;

COMMENT ON COLUMN application_form_fields.input_type IS
'A rendering hint for the UI indicating how the field should be '
'displayed to the user.';
