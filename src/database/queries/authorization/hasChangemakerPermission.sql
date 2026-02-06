SELECT has_changemaker_permission(
	:userKeycloakUserId,
	:isAdministrator,
	:changemakerId,
	:permission::permission_grant_verb_t,
	:scope::permission_grant_entity_type_t
) AS "hasPermission";
