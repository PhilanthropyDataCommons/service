CREATE TABLE application_form_fields (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  application_form_id INTEGER NOT NULL,
  canonical_field_short_code VARCHAR NOT NULL,
  position INTEGER NOT NULL,
  label VARCHAR,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_application_form
    FOREIGN KEY(application_form_id)
      REFERENCES application_forms(id),
  CONSTRAINT fk_canonical_field
    FOREIGN KEY(canonical_field_short_code)
      REFERENCES canonical_fields(short_code),
  UNIQUE(application_form_id, position)
);

COMMENT ON TABLE application_form_fields is
  'Application form fields represent a specific piece of data being collected as part of a given application form.';
COMMENT ON COLUMN application_form_fields.canonical_field_short_code is 'The short code of the canonical field associated with the data being collected by this form field';
COMMENT ON COLUMN application_form_fields.position is 'The order that this field should appear on the application form';
COMMENT ON COLUMN application_form_fields.label is 'The language presented to an applicant for this field';
