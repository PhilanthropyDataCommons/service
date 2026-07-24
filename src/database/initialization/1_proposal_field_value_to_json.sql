SELECT drop_function('proposal_field_value_to_json');

CREATE FUNCTION proposal_field_value_to_json(
	proposal_field_value proposal_field_values,
	application_form_field jsonb,
	file jsonb,
	proposal_id integer
) RETURNS jsonb AS $$
	SELECT jsonb_build_object(
		'id', proposal_field_value.id,
		'proposalId', proposal_field_value_to_json.proposal_id,
		'proposalVersionId', proposal_field_value.proposal_version_id,
		'applicationFormFieldId', proposal_field_value.application_form_field_id,
		'applicationFormField', application_form_field,
		'position', proposal_field_value.position,
		'value', proposal_field_value.value,
		'file', file,
		'goodAsOf', proposal_field_value.good_as_of,
		'isValid', proposal_field_value.is_valid,
		'createdAt', proposal_field_value.created_at
	);
$$ LANGUAGE sql IMMUTABLE;
