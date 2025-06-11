-- Prevent inserting proposal field values for forbidden application form fields
CREATE OR REPLACE FUNCTION prevent_inserting_forbidden_proposal_field_value()
RETURNS trigger AS $$
DECLARE
    forbidden BOOLEAN;
BEGIN
    SELECT EXISTS (
			SELECT 1
				FROM application_form_fields
				JOIN base_fields on application_form_fields.base_field_short_code = base_fields.short_code
				WHERE application_form_fields.id = NEW.application_form_field_id
					AND base_fields.sensitivity_classification = 'forbidden'
		) INTO forbidden;

    IF forbidden THEN
        RAISE EXCEPTION 'Cannot insert proposal field value for forbidden application form field %', NEW.application_form_field_id
            USING ERRCODE = '23514'; -- check_violation
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_forbidden_proposal_field_value
BEFORE INSERT ON proposal_field_values
FOR EACH ROW
EXECUTE FUNCTION prevent_inserting_forbidden_proposal_field_value();
