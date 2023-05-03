ALTER TABLE canonical_fields RENAME TO base_fields;

ALTER TABLE application_form_fields
  RENAME CONSTRAINT fk_canonical_field TO fk_base_field;

ALTER TABLE application_form_fields
  RENAME COLUMN canonical_field_id TO base_field_id;

COMMENT ON TABLE base_fields is
  'Base fields are those fields that are unique across organizations.';
COMMENT ON COLUMN application_form_fields.base_field_id IS 'The id of the base field associated with the data being collected by this form field';
