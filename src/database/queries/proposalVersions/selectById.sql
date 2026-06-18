SELECT
	proposal_version_to_json(
		proposal_versions.*,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object
FROM proposal_versions
	INNER JOIN
		permitted_proposal_ids(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'view',
			'proposal'
		) AS permitted_proposals
		ON proposal_versions.proposal_id = permitted_proposals.id
WHERE proposal_versions.id = :proposalVersionId;
