ALTER TABLE application_form_fields
ADD COLUMN instructions text;

COMMENT ON COLUMN application_form_fields.instructions IS
'Instructions for the user to fill information into the application form field.'; -- noqa: LT05
