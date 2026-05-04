SELECT has_proposal_version_permission(
	:userKeycloakUserId,
	:isAdministrator,
	:proposalVersionId,
	:permission::permission_grant_verb_t,
	:scope::permission_grant_entity_type_t
) AS "hasPermission";
