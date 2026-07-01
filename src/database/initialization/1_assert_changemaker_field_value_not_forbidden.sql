SELECT drop_function('assert_changemaker_field_value_not_forbidden');

-- Raises if the field value belongs to a forbidden base field, so a forbidden
-- value is never serialized. Read paths exclude forbidden fields via the
-- permitted_* functions; this guards the paths that serialize a row directly.
CREATE FUNCTION assert_changemaker_field_value_not_forbidden(
	changemaker_field_value changemaker_field_values
) RETURNS void AS $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM base_fields
		WHERE base_fields.short_code
			= changemaker_field_value.base_field_short_code
			AND base_fields.sensitivity_classification = 'forbidden'
	) THEN
		RAISE EXCEPTION
			'Refusing to serialize forbidden changemaker_field_value (%)',
			changemaker_field_value.id
			USING ERRCODE = '22023'; -- invalid_parameter_value
	END IF;
END;
$$ LANGUAGE plpgsql STABLE;
