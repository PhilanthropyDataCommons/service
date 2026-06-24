SELECT proposal_field_value_to_json(proposal_field_values.*) AS object
FROM proposal_field_values
	INNER JOIN
		permitted_proposal_field_value_ids(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'view',
			'proposalFieldValue'
		) AS permitted_proposal_field_values
		ON proposal_field_values.id = permitted_proposal_field_values.id
WHERE proposal_field_values.id = :proposalFieldValueId;
