SELECT has_source_permission(
	:userKeycloakUserId,
	:isAdministrator,
	:sourceId,
	:permission::permission_grant_verb_t,
	:scope::permission_grant_entity_type_t
) AS "hasPermission";
