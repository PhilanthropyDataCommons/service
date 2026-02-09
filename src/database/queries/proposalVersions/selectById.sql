SELECT
	proposal_version_to_json(
		proposal_versions.*,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object
FROM proposal_versions
WHERE
	id = :proposalVersionId
	AND has_proposal_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		proposal_id,
		'view',
		'proposal'
	);
