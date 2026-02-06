SELECT has_opportunity_permission(
	:userKeycloakUserId,
	:isAdministrator,
	:opportunityId,
	:permission::permission_grant_verb_t,
	:scope::permission_grant_entity_type_t
) AS "hasPermission";
