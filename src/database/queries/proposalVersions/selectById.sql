SELECT
	build_proposal_version_result(
		proposal_versions,
		:authContextId,
		:authContextIsAdministrator
	) AS object
FROM proposal_versions
WHERE
	proposal_versions.id = :proposalVersionId
	AND proposal_versions.proposal_id IN (
		SELECT permitted_proposals.id
		FROM permitted_proposal_ids(
			:authContextId,
			:authContextIsAdministrator,
			'view',
			'proposal'
		) AS permitted_proposals
	);
