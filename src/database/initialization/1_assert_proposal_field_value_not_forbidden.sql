SELECT drop_function('assert_proposal_field_value_not_forbidden');

-- Raises if the field value belongs to a forbidden base field, so a forbidden
-- value is never serialized. Read paths exclude forbidden fields via the
-- permitted_* functions; this guards the paths that serialize a row directly
-- (the field value insert), which do not filter by permission.
CREATE FUNCTION assert_proposal_field_value_not_forbidden(
	proposal_field_value proposal_field_values
) RETURNS void AS $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM application_form_fields
		INNER JOIN base_fields
			ON base_fields.short_code = application_form_fields.base_field_short_code
		WHERE application_form_fields.id
			= proposal_field_value.application_form_field_id
			AND base_fields.sensitivity_classification = 'forbidden'
	) THEN
		RAISE EXCEPTION
			'Refusing to serialize forbidden proposal_field_value (%)',
			proposal_field_value.id
			USING ERRCODE = '22023'; -- invalid_parameter_value
	END IF;
END;
$$ LANGUAGE plpgsql STABLE;
