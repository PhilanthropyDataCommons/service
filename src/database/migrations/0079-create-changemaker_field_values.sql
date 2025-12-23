CREATE TABLE changemaker_field_values (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	changemaker_id integer NOT NULL,
	base_field_short_code varchar NOT NULL,
	batch_id integer NOT NULL,
	value varchar NOT NULL,
	is_valid boolean NOT NULL DEFAULT TRUE,
	good_as_of timestamp with time zone,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	CONSTRAINT fk_changemaker
	FOREIGN KEY (changemaker_id)
	REFERENCES changemakers (id)
	ON DELETE CASCADE,
	CONSTRAINT fk_base_field
	FOREIGN KEY (base_field_short_code)
	REFERENCES base_fields (short_code)
	ON DELETE RESTRICT,
	CONSTRAINT fk_batch
	FOREIGN KEY (batch_id)
	REFERENCES changemaker_field_value_batches (id)
	ON DELETE RESTRICT
);

COMMENT ON TABLE changemaker_field_values IS
'Field values directly associated with changemakers.';

-- Create indexes
CREATE INDEX idx_changemaker_field_values_changemaker
ON changemaker_field_values (changemaker_id);

CREATE INDEX idx_changemaker_field_values_base_field
ON changemaker_field_values (base_field_short_code);

-- Add full-text search support
ALTER TABLE changemaker_field_values
ADD COLUMN value_search tsvector
GENERATED ALWAYS AS (to_tsvector('english', value)) STORED;

CREATE INDEX idx_changemaker_field_values_value_search
ON changemaker_field_values
USING gin (value_search);

-- Trigger to prevent forbidden fields
CREATE OR REPLACE FUNCTION prevent_forbidden_changemaker_field_value()
RETURNS trigger AS $$
DECLARE
    forbidden BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM base_fields
        WHERE base_fields.short_code = NEW.base_field_short_code
          AND base_fields.sensitivity_classification = 'forbidden'
    ) INTO forbidden;

    IF forbidden THEN
        RAISE EXCEPTION 'Cannot insert changemaker field value for forbidden base field %', NEW.base_field_short_code
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_forbidden_changemaker_field_value
BEFORE INSERT OR UPDATE ON changemaker_field_values
FOR EACH ROW
EXECUTE FUNCTION prevent_forbidden_changemaker_field_value();

-- Trigger to enforce organization category
CREATE OR REPLACE FUNCTION
enforce_organization_category_changemaker_field_value()
RETURNS trigger AS $$
DECLARE
    wrong_category BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM base_fields
        WHERE base_fields.short_code = NEW.base_field_short_code
          AND base_fields.category != 'organization'
    ) INTO wrong_category;

    IF wrong_category THEN
        RAISE EXCEPTION 'Cannot insert changemaker field value for non-organization base field %', NEW.base_field_short_code
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_organization_category_changemaker_field_value
BEFORE INSERT OR UPDATE ON changemaker_field_values
FOR EACH ROW
EXECUTE FUNCTION enforce_organization_category_changemaker_field_value();
