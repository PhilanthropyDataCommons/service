SELECT exists(
	SELECT 1
	FROM
		permitted_proposal_ids(
			:userKeycloakUserId,
			:isAdministrator,
			:permission::permission_grant_verb_t,
			:scope::permission_grant_entity_type_t
		) AS permitted_proposals
	WHERE permitted_proposals.id = :proposalId
) AS "hasPermission";
