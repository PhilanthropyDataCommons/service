SELECT proposal_to_json(proposals.*) AS object
FROM proposals
WHERE
	proposals.id = :proposalId
	AND has_proposal_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		proposals.id,
		'view',
		'proposal'
	);
