SELECT drop_function('proposal_field_value_to_json');

CREATE FUNCTION proposal_field_value_to_json(
	proposal_field_value proposal_field_values
)
RETURNS jsonb AS $$
DECLARE
	is_forbidden BOOLEAN;
	application_form_field_json JSONB;
BEGIN
	SELECT EXISTS (
		SELECT 1
		FROM application_form_fields
		JOIN base_fields ON application_form_fields.base_field_short_code = base_fields.short_code
		WHERE application_form_fields.id = proposal_field_value.application_form_field_id
			AND base_fields.sensitivity_classification = 'forbidden'
	) INTO is_forbidden;

	IF is_forbidden THEN
		RAISE EXCEPTION 'Attempt to convert forbidden proposal_field_value to JSON (%)', proposal_field_value.id
			USING ERRCODE = '22023'; -- invalid_parameter_value
	END IF;

	SELECT application_form_field_to_json(application_form_fields.*)
	INTO application_form_field_json
	FROM application_form_fields
	WHERE application_form_fields.id = proposal_field_value.application_form_field_id;

	RETURN jsonb_build_object(
		'id', proposal_field_value.id,
		'proposalVersionId', proposal_field_value.proposal_version_id,
		'applicationFormFieldId', proposal_field_value.application_form_field_id,
		'applicationFormField', application_form_field_json,
		'position', proposal_field_value.position,
		'value', proposal_field_value.value,
		'goodAsOf', proposal_field_value.good_as_of,
		'isValid', proposal_field_value.is_valid,
		'createdAt', proposal_field_value.created_at
	);
END;
$$ LANGUAGE plpgsql;
