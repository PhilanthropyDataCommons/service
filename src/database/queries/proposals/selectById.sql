SELECT
	proposal_to_json(
		proposals.*,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object
FROM proposals
	INNER JOIN
		permitted_proposal_ids(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'view',
			'proposal'
		) AS permitted_proposals
		ON proposals.id = permitted_proposals.id
WHERE proposals.id = :proposalId;
