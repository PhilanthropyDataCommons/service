SELECT proposal_version_to_json(proposal_versions.*) AS object
FROM proposal_versions
WHERE
	proposal_versions.id = :proposalVersionId
	AND has_proposal_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		proposal_versions.proposal_id,
		'view',
		'proposal'
	);
