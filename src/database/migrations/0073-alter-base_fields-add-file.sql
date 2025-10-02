CREATE TYPE updated_field_type AS ENUM (
	'string',
	'number',
	'phone_number',
	'email',
	'url',
	'boolean',
	'currency',
	'file'
);
ALTER TABLE base_fields
ALTER COLUMN data_type TYPE updated_field_type USING
data_type::text::updated_field_type;
DROP TYPE field_type CASCADE;
ALTER TYPE updated_field_type RENAME TO field_type;
