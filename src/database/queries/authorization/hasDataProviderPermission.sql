SELECT exists(
	SELECT 1
	FROM
		permitted_data_provider_short_codes(
			:userKeycloakUserId,
			:isAdministrator,
			:permission::permission_grant_verb_t,
			:scope::permission_grant_entity_type_t
		) AS permitted_data_providers
	WHERE permitted_data_providers.short_code = :dataProviderShortCode
) AS "hasPermission";
