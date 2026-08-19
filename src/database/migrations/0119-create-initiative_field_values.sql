CREATE TABLE initiative_field_values (
	id int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	initiative_id int NOT NULL REFERENCES initiatives (id) ON DELETE CASCADE,
	base_field_short_code text NOT NULL
	REFERENCES base_fields (short_code) ON DELETE RESTRICT,
	source_id int NOT NULL REFERENCES sources (id) ON DELETE RESTRICT,
	value text NOT NULL,
	is_valid boolean NOT NULL DEFAULT TRUE,
	good_as_of timestamp with time zone,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	created_by uuid NOT NULL REFERENCES users (keycloak_user_id) ON DELETE CASCADE
);

COMMENT ON TABLE initiative_field_values IS
'Base field values captured directly against an initiative.';

CREATE INDEX idx_initiative_field_values_initiative
ON initiative_field_values (initiative_id);

CREATE INDEX idx_initiative_field_values_base_field
ON initiative_field_values (base_field_short_code);

CREATE INDEX idx_initiative_field_values_source
ON initiative_field_values (source_id);

CREATE OR REPLACE FUNCTION prevent_forbidden_initiative_field_value()
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
        RAISE EXCEPTION 'Cannot insert initiative field value for forbidden base field %', NEW.base_field_short_code
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_forbidden_initiative_field_value
BEFORE INSERT OR UPDATE ON initiative_field_values
FOR EACH ROW
EXECUTE FUNCTION prevent_forbidden_initiative_field_value();

CREATE OR REPLACE FUNCTION
prevent_organization_category_initiative_field_value()
RETURNS trigger AS $$
DECLARE
    wrong_category BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM base_fields
        WHERE base_fields.short_code = NEW.base_field_short_code
          AND base_fields.category = 'organization'
    ) INTO wrong_category;

    IF wrong_category THEN
        RAISE EXCEPTION 'Cannot insert initiative field value for organization base field %', NEW.base_field_short_code
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_organization_category_initiative_field_value
BEFORE INSERT OR UPDATE ON initiative_field_values
FOR EACH ROW
EXECUTE FUNCTION prevent_organization_category_initiative_field_value();

SELECT audit_table('initiative_field_values');
