INSERT INTO proposal_field_values (
	proposal_version_id,
	application_form_field_id,
	value,
	position,
	is_valid,
	good_as_of
) VALUES (
	:proposalVersionId,
	:applicationFormFieldId,
	:value,
	:position,
	:isValid,
	:goodAsOf
)
RETURNING build_proposal_field_value_result(proposal_field_values) AS object;
