SELECT has_data_provider_permission(
	:userKeycloakUserId,
	:isAdministrator,
	:dataProviderShortCode,
	:permission::permission_grant_verb_t,
	:scope::permission_grant_entity_type_t
) AS "hasPermission";
