SELECT build_proposal_field_value_result(proposal_field_values) AS object
FROM proposal_field_values
WHERE
	proposal_field_values.id = :proposalFieldValueId
	AND proposal_field_values.id IN (
		SELECT permitted_field_values.id
		FROM permitted_proposal_field_value_ids(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'view',
			'proposalFieldValue'
		) AS permitted_field_values
	);
