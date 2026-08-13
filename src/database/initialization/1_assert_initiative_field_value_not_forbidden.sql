SELECT drop_function('assert_initiative_field_value_not_forbidden');

-- Raises if the field value belongs to a forbidden base field, so a forbidden
-- value is never serialized. Read paths exclude forbidden fields themselves;
-- this guards the paths that serialize a row directly (the field value insert
-- and update), which do not filter by sensitivity.
CREATE FUNCTION assert_initiative_field_value_not_forbidden(
	initiative_field_value initiative_field_values
) RETURNS void AS $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM base_fields
		WHERE base_fields.short_code
			= initiative_field_value.base_field_short_code
			AND base_fields.sensitivity_classification = 'forbidden'
	) THEN
		RAISE EXCEPTION
			'Refusing to serialize forbidden initiative_field_value (%)',
			initiative_field_value.id
			USING ERRCODE = '22023'; -- invalid_parameter_value
	END IF;
END;
$$ LANGUAGE plpgsql STABLE;
