SELECT has_funder_permission(
	:userKeycloakUserId,
	:isAdministrator,
	:funderShortCode,
	:permission::permission_grant_verb_t,
	:scope::permission_grant_entity_type_t
) AS "hasPermission";
