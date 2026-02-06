SELECT has_proposal_permission(
	:userKeycloakUserId,
	:isAdministrator,
	:proposalId,
	:permission::permission_grant_verb_t,
	:scope::permission_grant_entity_type_t
) AS "hasPermission";
