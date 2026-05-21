SELECT has_terminology_set_permission(
	:userKeycloakUserId,
	:isAdministrator,
	:terminologySetId,
	:permission::permission_grant_verb_t,
	:scope::permission_grant_entity_type_t
) AS "hasPermission";
