SELECT exists(
	SELECT 1
	FROM
		permitted_funder_short_codes(
			:userKeycloakUserId,
			:isAdministrator,
			:permission::permission_grant_verb_t,
			:scope::permission_grant_entity_type_t
		) AS permitted_funders
	WHERE permitted_funders.short_code = :funderShortCode
) AS "hasPermission";
