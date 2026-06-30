SELECT
	build_proposal_version_result(
		proposal_versions,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object
FROM proposal_versions
WHERE
	proposal_versions.id = :proposalVersionId
	AND proposal_versions.proposal_id IN (
		SELECT permitted_proposals.id
		FROM permitted_proposal_ids(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'view',
			'proposal'
		) AS permitted_proposals
	);
