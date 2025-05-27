CREATE TYPE sensitivity_classification AS ENUM (
	'public', 'restricted', 'forbidden'
);

ALTER TABLE base_fields
ADD COLUMN sensitivity_classification sensitivity_classification
DEFAULT 'restricted';

ALTER TABLE base_fields
ALTER COLUMN sensitivity_classification DROP DEFAULT;

COMMENT ON COLUMN base_fields.sensitivity_classification IS
'Indicates how the system should handle data tied to this base field';
