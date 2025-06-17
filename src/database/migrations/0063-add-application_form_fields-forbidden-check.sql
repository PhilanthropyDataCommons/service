-- Prevent inserting proposal field values for forbidden application form fields
CREATE OR REPLACE FUNCTION prevent_inserting_forbidden_application_form_fields()
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
        RAISE EXCEPTION 'Cannot insert application form fields for forbidden base field %', NEW.base_field_short_code
            USING ERRCODE = '23514'; -- check_violation
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_forbidden_application_form_field
BEFORE INSERT ON application_form_fields
FOR EACH ROW
EXECUTE FUNCTION prevent_inserting_forbidden_application_form_fields();
