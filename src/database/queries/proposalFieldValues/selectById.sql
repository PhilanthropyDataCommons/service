SELECT proposal_field_value_to_json(proposal_field_values.*) AS object
FROM proposal_field_values
WHERE
	id = :proposalFieldValueId
	AND has_proposal_field_value_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		id,
		'view',
		'proposalFieldValue'
	);
