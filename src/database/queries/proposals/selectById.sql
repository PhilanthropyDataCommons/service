SELECT
	proposal_to_json(
		proposals.*,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object
FROM proposals
WHERE
	id = :proposalId
	AND has_proposal_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		id,
		'view',
		'proposal'
	);
