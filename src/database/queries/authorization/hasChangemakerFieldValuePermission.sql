SELECT has_changemaker_field_value_permission(
	:userKeycloakUserId,
	:isAdministrator,
	:changemakerFieldValueId,
	:permission::permission_grant_verb_t,
	:scope::permission_grant_entity_type_t
) AS "hasPermission";
