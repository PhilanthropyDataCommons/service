ALTER TABLE application_forms
ADD COLUMN name text;

COMMENT ON COLUMN application_forms.name IS
'An optional display name for the application form.';
